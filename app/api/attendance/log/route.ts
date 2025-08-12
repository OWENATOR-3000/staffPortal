// File: app/api/attendance/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Your existing permission checks are correct and will be preserved.
    const hasAdminPermission = await userHasPermission(session.userId, 'view_attendance_log');
    const hasOwnPermission = await userHasPermission(session.userId, 'view_own_attendance');

    if (!hasAdminPermission && !hasOwnPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ message: 'Start date and end date are required.' }, { status: 400 });
    }

    try {
        // Your existing "Detail View" logic is correct and will be preserved.
        if (staffId && staffId !== 'all') {
            const detailedLogQuery = `
                SELECT al.id, al.event_type, al.event_time, s.id as staff_id, s.full_name
                FROM attendance_log al JOIN staff s ON al.staff_id = s.id
                WHERE DATE(al.event_time) BETWEEN ? AND ? AND al.staff_id = ?
                ORDER BY al.event_time ASC;
            `;
            const [detailedLogs] = await db.query<RowDataPacket[]>(detailedLogQuery, [startDate, endDate, staffId]);
            return NextResponse.json({ view: 'detail', logs: detailedLogs });
        }

        // ====================================================================
        // THIS IS THE ONLY PART THAT IS BEING REPLACED.
        // The new summary query is an evolution of your old one, but it now
        // includes the necessary IDs and source information for the frontend.
        // ====================================================================
        const summaryQuery = `
            WITH PairedEvents AS (
                -- Step 1: Pair up each clock-in with its immediate next clock-out on the same day.
                SELECT
                    t1.id as clock_in_id,
                    t1.staff_id,
                    t1.event_time AS clock_in_time,
                    (
                        SELECT MIN(t2.id)
                        FROM attendance_log t2
                        WHERE t2.staff_id = t1.staff_id AND t2.event_type = 'clock_out' AND t2.event_time > t1.event_time AND DATE(t2.event_time) = DATE(t1.event_time)
                    ) AS clock_out_id
                FROM attendance_log t1
                WHERE t1.event_type = 'clock_in' AND DATE(t1.event_time) BETWEEN ? AND ?
            ),
            AggregatedDaily AS (
                -- Step 2: Group by day to get total time, first in, and last out.
                SELECT
                    p.staff_id,
                    DATE(p.clock_in_time) AS attendance_date,
                    MIN(p.clock_in_time) AS first_clock_in,
                    MAX(al_out.event_time) AS last_clock_out,
                    SUM(TIMESTAMPDIFF(SECOND, p.clock_in_time, al_out.event_time)) as total_seconds_worked
                FROM PairedEvents p
                LEFT JOIN attendance_log al_out ON p.clock_out_id = al_out.id
                GROUP BY p.staff_id, DATE(p.clock_in_time)
            )
            -- Step 3: Join everything together to get all the final details.
            SELECT
                ad.staff_id,
                s.full_name,
                ad.attendance_date,
                ad.first_clock_in,
                ad.last_clock_out,
                -- Get the ID of the first clock-in
                (SELECT id FROM attendance_log WHERE event_time = ad.first_clock_in AND staff_id = ad.staff_id LIMIT 1) as clock_in_id,
                -- Get the ID and source of the last clock-out
                (SELECT id FROM attendance_log WHERE event_time = ad.last_clock_out AND staff_id = ad.staff_id LIMIT 1) as clock_out_id,
                (SELECT event_source FROM attendance_log WHERE event_time = ad.last_clock_out AND staff_id = ad.staff_id LIMIT 1) as clock_out_source,
                COALESCE(ad.total_seconds_worked, 0) as total_seconds_worked
            FROM AggregatedDaily ad
            JOIN staff s ON ad.staff_id = s.id
            ORDER BY ad.attendance_date DESC, s.full_name ASC;
        `;
        
        const [summaryLogs] = await db.query<RowDataPacket[]>(summaryQuery, [startDate, endDate]);
        return NextResponse.json({ view: 'summary', logs: summaryLogs });

    } catch (error) {
        console.error("Error fetching attendance log:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}