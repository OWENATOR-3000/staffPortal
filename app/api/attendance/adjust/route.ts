// File: app/api/attendance/adjust/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
    // 1. Security check for session and role.
    const session = await getSessionUser();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'hr')) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    try {
        // 2. Parse the request body. We now expect IDs for both events.
        const { clockInId, clockOutId, newClockIn, newClockOut, reason } = await request.json();

        if (!clockInId || !clockOutId || !newClockIn || !newClockOut || !reason) {
            return new NextResponse('Missing required fields.', { status: 400 });
        }

        const updateNote = `Adjusted by ${session.user.name} on ${new Date().toLocaleDateString()}: ${reason}`;

        // 3. Update the 'clock_in' record.
        await db.query(
            `UPDATE attendance_log SET event_time = ?, event_source = 'adjusted', notes = ? WHERE id = ?`,
            [newClockIn, updateNote, clockInId]
        );

        // 4. Update the 'clock_out' record.
        await db.query(
            `UPDATE attendance_log SET event_time = ?, event_source = 'adjusted', notes = ? WHERE id = ?`,
            [newClockOut, updateNote, clockOutId]
        );

        return NextResponse.json({ message: 'Attendance records updated successfully.' });

    } catch (error) {
        console.error('Error in /api/attendance/adjust:', error);
        return new NextResponse('Failed to adjust attendance records.', { status: 500 });
    }
}