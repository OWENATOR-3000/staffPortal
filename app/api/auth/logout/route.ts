// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server'; // NextRequest is no longer needed
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface LastEventPacket extends RowDataPacket {
  event_type: 'clock_in' | 'clock_out';
}

// FIXED: Removed the unused `_req: NextRequest` parameter
export async function POST() {
  const token = (await cookies()).get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    (await cookies()).delete('authToken');
    return NextResponse.json({ message: 'Invalid token, logged out.' }, { status: 401 });
  }

  try {
    const userId = payload.userId;

    // --- NEW LOGIC: Check the last attendance event before clocking out ---
    const checkLastEventQuery = `
      SELECT event_type 
      FROM attendance_log 
      WHERE staff_id = ? 
      ORDER BY event_time DESC 
      LIMIT 1
    `;
     const [lastEvents] = await db.query<LastEventPacket[]>(checkLastEventQuery, [userId]);
    
    // You must have at least one event to clock out. And it must be a 'clock_in'.
    if (lastEvents.length === 0 || lastEvents[0].event_type === 'clock_out') {
      console.error(`VALIDATION FAILED: User ${userId} is not clocked in or has no records.`);
      return NextResponse.json(
        { message: 'You cannot clock out because you are not currently clocked in.' },
        { status: 409 } // 409 Conflict
      );
    }
    // --- END OF NEW LOGIC ---

    // 1. Record the Clock-Out Event (Now safe to run)
    await db.query('INSERT INTO attendance_log (staff_id, event_type) VALUES (?, ?)', [userId, 'clock_out']);

    // 2. Clear the cookie
    (await
      // 2. Clear the cookie
      cookies()).delete('authToken');

    return NextResponse.json({ message: 'Logout successful and clocked out.' });
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}