// File: app/api/cron/auto-clock-out/route.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
    // Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // This query is the heart of the new logic. It finds all staff members
        // whose VERY LAST event on the current day was a 'clock_in'.
        const today = new Date().toISOString().slice(0, 10);

        const [usersToClockOut] = await db.query<RowDataPacket[]>(`
            SELECT t1.staff_id, t1.event_time as last_clock_in_time
            FROM attendance_log t1
            INNER JOIN (
                SELECT staff_id, MAX(event_time) AS max_event_time
                FROM attendance_log
                WHERE DATE(event_time) = ?
                GROUP BY staff_id
            ) t2 ON t1.staff_id = t2.staff_id AND t1.event_time = t2.max_event_time
            WHERE t1.event_type = 'clock_in'
        `, [today]);

        if (usersToClockOut.length === 0) {
            return NextResponse.json({ message: 'Success: No users needed auto-clock-out.' });
        }

        // For each user found, insert a new 'clock_out' event.
        for (const user of usersToClockOut) {
            const clockOutTime = `${today} 18:00:00`;
            await db.query(
                `INSERT INTO attendance_log (staff_id, event_type, event_source, event_time)
                 VALUES (?, 'clock_out', 'system', ?)`,
                [user.staff_id, clockOutTime]
            );
        }

        const clockedOutIds = usersToClockOut.map(u => u.staff_id);
        console.log(`[CRON] Auto-clocked-out ${clockedOutIds.length} users.`);

        return NextResponse.json({
            message: `Successfully created clock-out events for ${clockedOutIds.length} users.`,
            staff_ids: clockedOutIds
        });

    } catch (error) {
        console.error('[CRON] Auto-clock-out job failed:', error);
        return new NextResponse('Internal Server Error during cron job execution.', { status: 500 });
    }
}