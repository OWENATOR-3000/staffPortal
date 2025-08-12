// app/api/requests/deny/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { createNotificationForRequester } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) { 
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
   }
  // TODO: Add permission check

  const requestId = params.id;
  const { reason } = await req.json();
  if (!reason) { 
      return NextResponse.json({ message: 'A reason is required.' }, { status: 400 });
  }

  try {
    const [requestResult] = await db.query<RowDataPacket[]>(
        'SELECT staff_id, requestable_type FROM requests WHERE id = ?', [requestId]
    );
    if (requestResult.length === 0) {
        return NextResponse.json({ message: 'Request not found.' }, { status: 404 });
    }
    const { staff_id, requestable_type } = requestResult[0];

    await db.query(
      `UPDATE requests SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [reason, session.userId, requestId]
    );

    // --- THIS IS THE FIX ---
    // We now provide all three required arguments.
    await createNotificationForRequester(
        staff_id,
        `Your ${requestable_type} request (#${requestId}) has been denied.`,
        `/dashboard/my-requests` // The URL for the employee to click
    );

    return NextResponse.json({ message: 'Request denied successfully.' });
  } catch (error) {
      console.error("Deny request error:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}