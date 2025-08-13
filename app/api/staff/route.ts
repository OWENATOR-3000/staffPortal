// File: app/api/staff/route.ts

import {  NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    // 1. Security Check: Ensure user is authenticated.
    // We can be lenient on the role here since many parts of the app might need this list.
    // If you want to restrict it to only admins/hr, add a role check.
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Query the database for the staff list.
        // We only select the 'id' and 'full_name' to keep the payload small.
        const [staffList] = await db.query<RowDataPacket[]>(
            `SELECT id, full_name FROM staff ORDER BY full_name ASC`
        );
        
        // 3. Return the data in the format the frontend expects.
        return NextResponse.json({ staff: staffList });

    } catch (error) {
        console.error('Error fetching staff list:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}