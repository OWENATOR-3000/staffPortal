// app/api/payroll/generate-payslip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Not authenticated' }, { status: 401 }); }

    // Secure the endpoint
    const hasPermission = await userHasPermission(session.userId, 'manage_payroll_settings');
    if (!hasPermission) { return NextResponse.json({ message: 'Forbidden' }, { status: 403 }); }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const payPeriodEndDate = searchParams.get('endDate');
    
    if (!staffId || !payPeriodEndDate) {
        return NextResponse.json({ message: 'Staff ID and pay period end date are required.' }, { status: 400 });
    }
    
    const payPeriodStartDate = `${payPeriodEndDate.substring(0, 8)}01`; // First day of the selected month
    const yearStartDate = `${payPeriodEndDate.substring(0, 4)}-01-01`;

    try {
        // --- 1. FETCH ALL DATA ---

        // Fetch staff base details
        const [staffResults] = await db.query<RowDataPacket[]>('SELECT * FROM staff WHERE id = ?', [staffId]);
        const staff = staffResults[0];
        if (!staff) { return NextResponse.json({ message: 'Staff not found.' }, { status: 404 }); }

        // Fetch regular hours worked in the pay period
        const [regularHoursResult] = await db.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, t1.event_time, 
                (SELECT MIN(t2.event_time) FROM attendance_log t2 WHERE t2.staff_id = t1.staff_id AND t2.event_type = 'clock_out' AND t2.event_time > t1.event_time AND DATE(t2.event_time) = DATE(t1.event_time))
            )), 0) as total_seconds
            FROM attendance_log t1 
            WHERE t1.staff_id = ? AND t1.event_type = 'clock_in' AND DATE(t1.event_time) BETWEEN ? AND ?`,
            [staffId, payPeriodStartDate, payPeriodEndDate]
        );
        const regularHours = (regularHoursResult[0].total_seconds || 0) / 3600;

        // Fetch all approved overtime requests for the period
        const [overtimeRequests] = await db.query<RowDataPacket[]>(
            `SELECT ot.hours_worked, ot.overtime_type 
             FROM requests r JOIN overtime_requests ot ON r.requestable_id = ot.id 
             WHERE r.requestable_type = 'Overtime' AND r.status = 'approved' AND r.staff_id = ? AND ot.overtime_date BETWEEN ? AND ?`,
            [staffId, payPeriodStartDate, payPeriodEndDate]
        );

        // Fetch total approved loans and salary advances for YTD deductions (simplified)
        const [deductionRequests] = await db.query<RowDataPacket[]>(
            `SELECT r.requestable_type, COALESCE(SUM(sa.amount_requested), 0) as total_advances, COALESCE(SUM(l.amount_requested), 0) as total_loans
             FROM requests r
             LEFT JOIN salary_advance_requests sa ON r.requestable_id = sa.id AND r.requestable_type = 'Salary Advance'
             LEFT JOIN loan_requests l ON r.requestable_id = l.id AND r.requestable_type = 'Loan'
             WHERE r.status = 'approved' AND r.staff_id = ? AND r.created_at BETWEEN ? AND ?
             GROUP BY r.requestable_type`,
            [staffId, yearStartDate, payPeriodEndDate]
        );

        // --- 2. PROCESS AND CALCULATE ---

        const baseHourlyRate = parseFloat(staff.hourly_rate);
        
        let normalOvertimeHours = 0;
        let sundayOvertimeHours = 0;
        overtimeRequests.forEach(ot => {
            if (ot.overtime_type === 'Normal') normalOvertimeHours += parseFloat(ot.hours_worked);
            else if (ot.overtime_type === 'Sunday') sundayOvertimeHours += parseFloat(ot.hours_worked);
        });

        const loanDeduction = deductionRequests.find(d => d.requestable_type === 'Loan')?.total_loans || 0;
        const advanceDeduction = deductionRequests.find(d => d.requestable_type === 'Salary Advance')?.total_advances || 0;

        // Calculate Earnings
        const basicPay = regularHours * baseHourlyRate;
        const normalOvertimePay = normalOvertimeHours * (baseHourlyRate * 1.5);
        const sundayOvertimePay = sundayOvertimeHours * (baseHourlyRate * 2.0);
        const bonus = parseFloat(staff.bonus || 0);
        const housingAllowance = parseFloat(staff.housing_allowance || 0);
        const medicalAllowance = parseFloat(staff.medical_allowance || 0);
        const otherAllowance = parseFloat(staff.other_allowance || 0);
        const totalEarnings = basicPay + normalOvertimePay + sundayOvertimePay + bonus + housingAllowance + medicalAllowance + otherAllowance;

        // Calculate Deductions (assuming some are manual for now)
        const sscDeduction = parseFloat(staff.social_security_contribution || 0);
        // Income Tax would require a complex tax bracket calculation - simplified here
        const incomeTaxDeduction = totalEarnings * 0.10; // Simplified 10% tax for example
        const totalDeductions = loanDeduction + advanceDeduction + sscDeduction + incomeTaxDeduction;
        
        // Final Calculation
        const grossIncome = totalEarnings;
        const netIncome = grossIncome - totalDeductions;

        // --- 3. CONSTRUCT THE PAYSLIP OBJECT ---
        const payslip = {
            name: staff.first_name,
            surname: staff.last_name,
            payPeriod: `${payPeriodStartDate} to ${payPeriodEndDate}`,
            earnings: {
                basic: basicPay.toFixed(2),
                normalOvertime: normalOvertimePay.toFixed(2),
                sundayOvertime: sundayOvertimePay.toFixed(2),
                bonus: bonus.toFixed(2),
                housing: housingAllowance.toFixed(2),
                medical: medicalAllowance.toFixed(2),
                other: otherAllowance.toFixed(2),
            },
            deductions: {
                advance: advanceDeduction.toFixed(2),
                loan: loanDeduction.toFixed(2),
                ssc: sscDeduction.toFixed(2),
                tax: incomeTaxDeduction.toFixed(2),
            },
            summary: {
                totalEarnings: totalEarnings.toFixed(2),
                totalDeductions: totalDeductions.toFixed(2),
                grossIncome: grossIncome.toFixed(2),
                netIncome: netIncome.toFixed(2),
            }
        };

        return NextResponse.json(payslip);

    } catch (error) {
        console.error("Payslip generation failed:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}