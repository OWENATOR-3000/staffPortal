// app/api/payroll/initial-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Not authenticated' }, { status: 401 }); }

    const hasPermission = await userHasPermission(session.userId, 'manage_payroll_settings');
    if (!hasPermission) { return NextResponse.json({ message: 'Forbidden' }, { status: 403 }); }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const endDate = searchParams.get('endDate');
    
    if (!staffId || !endDate) {
        return NextResponse.json({ message: 'Staff ID and pay period end date are required.' }, { status: 400 });
    }
    
    const startDate = `${endDate.substring(0, 8)}01`;
    const yearStartDate = `${endDate.substring(0, 4)}-01-01`;

    try {
        // --- 1. FETCH ALL DATA ---

        const [staffResults] = await db.query<RowDataPacket[]>('SELECT * FROM staff WHERE id = ?', [staffId]);
        const staff = staffResults[0];
        if (!staff) { return NextResponse.json({ message: 'Staff not found.' }, { status: 404 }); }

        const [regularHoursResult] = await db.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, t1.event_time, 
                (SELECT MIN(t2.event_time) FROM attendance_log t2 WHERE t2.staff_id = t1.staff_id AND t2.event_type = 'clock_out' AND t2.event_time > t1.event_time AND DATE(t2.event_time) = DATE(t1.event_time))
            )), 0) as total_seconds
            FROM attendance_log t1 
            WHERE t1.staff_id = ? AND t1.event_type = 'clock_in' AND DATE(t1.event_time) BETWEEN ? AND ?`,
            [staffId, startDate, endDate]
        );
        
        const [overtimeRequests] = await db.query<RowDataPacket[]>(
            `SELECT ot.hours_worked, ot.overtime_type 
             FROM requests r JOIN overtime_requests ot ON r.requestable_id = ot.id 
             WHERE r.requestable_type = 'Overtime' AND r.status = 'approved' AND r.staff_id = ? AND ot.overtime_date BETWEEN ? AND ?`,
            [staffId, startDate, endDate]
        );

        const [loanResult] = await db.query<RowDataPacket[]>(
            `SELECT 
                COALESCE(SUM(l.amount_requested), 0) as total_loan_amount,
                (SELECT loan_type FROM loan_requests lr JOIN requests r ON lr.id = r.requestable_id WHERE r.staff_id = ? AND r.status = 'approved' ORDER BY r.created_at DESC LIMIT 1) as recent_loan_type
             FROM requests r
             JOIN loan_requests l ON r.requestable_id = l.id
             WHERE r.requestable_type = 'Loan' AND r.status = 'approved' AND r.staff_id = ? AND r.created_at BETWEEN ? AND ?`,
            [staffId, staffId, yearStartDate, endDate]
        );
        
        const [advanceResult] = await db.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(sa.amount_requested), 0) as total_advances
             FROM requests r JOIN salary_advance_requests sa ON r.requestable_id = sa.id
             WHERE r.requestable_type = 'Salary Advance' AND r.status = 'approved' AND r.staff_id = ? AND r.created_at BETWEEN ? AND ?`,
            [staffId, startDate, endDate]
        );

        // --- 2. PROCESS AND CALCULATE ---
        const hourlyRate = parseFloat(staff.hourly_rate);
        const regularHours = (regularHoursResult[0].total_seconds || 0) / 3600;
        
        let normalOvertimeHours = 0;
        let sundayOvertimeHours = 0;
        overtimeRequests.forEach(ot => {
            if (ot.overtime_type === 'Normal') normalOvertimeHours += parseFloat(ot.hours_worked);
            else if (ot.overtime_type === 'Sunday') sundayOvertimeHours += parseFloat(ot.hours_worked);
        });

        const basicPay = regularHours * hourlyRate;
        const normalOvertimePay = normalOvertimeHours * (hourlyRate * 1.5);
        const sundayOvertimePay = sundayOvertimeHours * (hourlyRate * 2.0);

        // --- 3. CONSTRUCT THE PAYSLIP OBJECT ---
        const initialData = {
            name: staff.first_name,
            surname: staff.last_name,
             ssc_code: staff.social_security_code || 'N/A',
            payPeriod: `${startDate} to ${endDate}`,
            earnings: {
                basic: basicPay,
                normalOvertime: normalOvertimePay,
                sundayOvertime: sundayOvertimePay,
                bonus: parseFloat(staff.bonus) || 0,
                housing: parseFloat(staff.housing_allowance) || 0,
                medical: parseFloat(staff.medical_allowance) || 0,
                other: parseFloat(staff.other_allowance) || 0,
            },
            deductions: {
                advance: parseFloat(advanceResult[0]?.total_advances) || 0,
                loan: parseFloat(loanResult[0]?.total_loan_amount) || 0,
                tax: 0, // Tax is a manual entry
            },
            loanType: loanResult[0]?.recent_loan_type || 'N/A'
        };

        return NextResponse.json(initialData);

    } catch (error) {
        console.error("Payslip initial data fetch failed:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}