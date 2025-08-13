// File: app/api/payroll/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';
import { eachDayOfInterval, isWeekend } from 'date-fns';

// Describes the shape of the staff salary/rate query result
interface StaffRatePacket extends RowDataPacket {
    hourly_rate: string; // Stored as DECIMAL/VARCHAR, parsed later
    monthly_salary: string;
}

// Describes the shape of the attendance log query result
interface AttendanceLogPacket extends RowDataPacket {
    event_type: 'clock_in' | 'clock_out';
    event_time: Date; // mysql2 converts DATETIME to JS Date objects
}

// Describes the shape of the overtime query result
interface OvertimePacket extends RowDataPacket {
    hours_worked: string; // Stored as DECIMAL/VARCHAR, parsed later
    overtime_type: 'Normal' | 'Sunday';
}

// --- Helper Functions ---

/**
 * NEW HELPER: Calculates the number of working days for the entire month of a given date.
 * This is used to determine the stable monthly rate for salaried employees.
 * @param date A date within the desired month.
 */
function getWorkingDaysInMonthOf(date: Date): number {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = eachDayOfInterval({ start: startOfMonth, end: endOfMonth });
    return daysInMonth.filter(day => !isWeekend(day)).length;
}

/**
 * Calculates the payable seconds for a single day, respecting core hours (8-5) and lunch (1-2).
 * @param events An array of clock-in/out pairs for a single day.
 */
function calculatePayableSecondsForDay(events: { clock_in_time: Date; clock_out_time: Date | null }[]): number {
    const CORE_START_HOUR = 8;
    const CORE_END_HOUR = 17;
    const LUNCH_START_HOUR = 13;
    const LUNCH_END_HOUR = 14;
    const MAX_PAYABLE_SECONDS = 8 * 3600;
    let totalPayableSeconds = 0;

    for (const event of events) {
        if (!event.clock_out_time) continue;
        let intervalStart = event.clock_in_time;
        let intervalEnd = event.clock_out_time;
        const coreStart = new Date(intervalStart);
        coreStart.setHours(CORE_START_HOUR, 0, 0, 0);
        const coreEnd = new Date(intervalStart);
        coreEnd.setHours(CORE_END_HOUR, 0, 0, 0);
        intervalStart = new Date(Math.max(intervalStart.getTime(), coreStart.getTime()));
        intervalEnd = new Date(Math.min(intervalEnd.getTime(), coreEnd.getTime()));
        if (intervalEnd <= intervalStart) continue;
        const lunchStart = new Date(intervalStart);
        lunchStart.setHours(LUNCH_START_HOUR, 0, 0, 0);
        const lunchEnd = new Date(intervalStart);
        lunchEnd.setHours(LUNCH_END_HOUR, 0, 0, 0);
        const lunchOverlapStart = Math.max(intervalStart.getTime(), lunchStart.getTime());
        const lunchOverlapEnd = Math.min(intervalEnd.getTime(), lunchEnd.getTime());
        const lunchOverlapSeconds = Math.max(0, (lunchOverlapEnd - lunchOverlapStart) / 1000);
        const intervalSeconds = (intervalEnd.getTime() - intervalStart.getTime()) / 1000;
        totalPayableSeconds += (intervalSeconds - lunchOverlapSeconds);
    }
    return Math.min(totalPayableSeconds, MAX_PAYABLE_SECONDS);
}

/**
 * Processes a raw, sorted event log into daily paired shifts.
 * @param logs Raw log from the database.
 */
function pairAttendanceLogs(logs: AttendanceLogPacket[]) {
    const dailyShifts: { [key: string]: { clock_in_time: Date; clock_out_time: Date | null }[] } = {};
    for (let i = 0; i < logs.length; i++) {
        const currentEvent = logs[i];
        if (currentEvent.event_type === 'clock_in') {
            const dateKey = currentEvent.event_time.toISOString().slice(0, 10);
            if (!dailyShifts[dateKey]) { dailyShifts[dateKey] = []; }
            const nextEvent = logs[i + 1];
            if (nextEvent && nextEvent.event_type === 'clock_out') {
                dailyShifts[dateKey].push({ clock_in_time: currentEvent.event_time, clock_out_time: nextEvent.event_time });
                i++; 
            } else {
                dailyShifts[dateKey].push({ clock_in_time: currentEvent.event_time, clock_out_time: null });
            }
        }
    }
    return dailyShifts;
}


// --- Main API Handler ---
export async function GET(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Not authenticated' }, { status: 401 }); }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!staffId || !startDateStr || !endDateStr) {
        return NextResponse.json({ message: 'staffId, startDate, and endDate are required.' }, { status: 400 });
    }

    try {
        const [staff] = await db.query<StaffRatePacket[]>('SELECT hourly_rate, monthly_salary FROM staff WHERE id = ?', [staffId]);
        if (staff.length === 0) { return NextResponse.json({ message: 'Staff not found' }, { status: 404 }); }
        
        const storedHourlyRate = parseFloat(staff[0].hourly_rate) || 0;
        const monthlySalary = parseFloat(staff[0].monthly_salary) || 0;

        const [rawLogs] = await db.query<AttendanceLogPacket[]>(
            `SELECT event_type, event_time FROM attendance_log WHERE staff_id = ? AND DATE(event_time) BETWEEN ? AND ? ORDER BY event_time ASC`,
            [staffId, startDateStr, endDateStr]
        );

        const dailyShifts = pairAttendanceLogs(rawLogs);
        let totalPayableSeconds = 0;
        for (const date in dailyShifts) {
            totalPayableSeconds += calculatePayableSecondsForDay(dailyShifts[date]);
        }
        const actualHoursWorked = totalPayableSeconds / 3600;

        let regularPay = 0;
        let effectiveHourlyRate = 0;

        if (monthlySalary > 0) {
            // Salaried Employee: Calculate a stable hourly rate based on the ENTIRE MONTH of the start date.
            const workingDaysInMonth = getWorkingDaysInMonthOf(new Date(startDateStr));
            const targetHoursForMonth = workingDaysInMonth * 8;
            
            effectiveHourlyRate = (targetHoursForMonth > 0) ? (monthlySalary / targetHoursForMonth) : 0;
            
            // Pay is the actual hours worked multiplied by this stable monthly rate.
            regularPay = actualHoursWorked * effectiveHourlyRate;
        } else {
            // Hourly Employee: Use the fixed rate stored in the database.
            effectiveHourlyRate = storedHourlyRate;
            regularPay = actualHoursWorked * effectiveHourlyRate;
        }

        // Overtime should always use the stored base hourly rate for consistency.
        const [overtimeRequests] = await db.query<OvertimePacket[]>(
            `SELECT ot.hours_worked, ot.overtime_type 
             FROM requests r 
             JOIN overtime_requests ot ON r.requestable_id = ot.id 
             WHERE r.requestable_type = 'Overtime' AND r.status = 'approved' AND r.staff_id = ? AND ot.overtime_date BETWEEN ? AND ?`,
            [staffId, startDateStr, endDateStr]
        );
        
        let normalOvertimeHours = 0;
        let sundayOvertimeHours = 0;
        overtimeRequests.forEach(ot => {
            if (ot.overtime_type === 'Normal') normalOvertimeHours += parseFloat(ot.hours_worked);
            else if (ot.overtime_type === 'Sunday') sundayOvertimeHours += parseFloat(ot.hours_worked);
        });

        const normalOvertimePay = normalOvertimeHours * (storedHourlyRate * 1.5);
        const sundayOvertimePay = sundayOvertimeHours * (storedHourlyRate * 2.0);
        const totalPay = regularPay + normalOvertimePay + sundayOvertimePay;

        return NextResponse.json({
            baseHourlyRate: effectiveHourlyRate,
            regularHours: actualHoursWorked,
            normalOvertimeHours: normalOvertimeHours,
            sundayOvertimeHours: sundayOvertimeHours,
            regularPay: regularPay,
            normalOvertimePay: normalOvertimePay,
            sundayOvertimePay: sundayOvertimePay,
            totalPay: totalPay
        });

    } catch (error) {
        console.error("Error calculating payroll:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}