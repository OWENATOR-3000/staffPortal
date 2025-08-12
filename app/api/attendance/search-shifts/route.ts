// File: app/api/attendance/search-shifts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
    // 1. Security Check: Must be Admin or HR
    const session = await getSessionUser();
    const userRole = session?.role?.toLowerCase();
    if (!session || (userRole !== 'admin' && userRole !== 'hr')) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const staffId = searchParams.get('staffId');
        const searchDate = searchParams.get('searchDate');

        if (!staffId || !searchDate) {
            return NextResponse.json({ message: 'Staff ID and Date are required.' }, { status: 400 });
        }

        // 2. SQL Query to find all paired clock-in/out events for that user on that day
        const query = `
            SELECT 
                cin.id AS clock_in_id,
                cin.event_time AS clock_in_time,
                cin.event_source AS clock_in_source,
                cout.id AS clock_out_id,
                cout.event_time AS clock_out_time,
                cout.event_source AS clock_out_source
            FROM 
                (SELECT * FROM attendance_log WHERE event_type = 'clock_in') AS cin
            LEFT JOIN 
                (SELECT * FROM attendance_log WHERE event_type = 'clock_out') AS cout
            ON 
                cin.staff_id = cout.staff_id AND cin.id = (
                    SELECT MAX(id) FROM attendance_log WHERE event_type = 'clock_in' AND id < cout.id AND staff_id = cin.staff_id AND DATE(event_time) = ?
                )
            WHERE 
                cin.staff_id = ? AND DATE(cin.event_time) = ?
            GROUP BY
                cin.id, cout.id
            ORDER BY 
                cin.event_time;
        `;
        
        const [shifts] = await db.query<RowDataPacket[]>(query, [searchDate, staffId, searchDate]);
        
        return NextResponse.json(shifts);

    } catch (error) {
        console.error('Error searching for shifts:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}