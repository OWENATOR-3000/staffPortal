// app/api/requests/approve/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { createNotificationForRequester } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

// Define an interface for the data returned by the SELECT query
interface RequestInfoPacket extends RowDataPacket {
  staff_id: number;
  requestable_type: string;
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // TODO: Permission check

  const requestId = params.id;

  try {
    // 2. First, find out who submitted the request
    const [requestResult] = await db.query<RequestInfoPacket[]>(
        'SELECT staff_id, requestable_type FROM requests WHERE id = ?', [requestId]
    );
    if (requestResult.length === 0) {
        return NextResponse.json({ message: 'Request not found.' }, { status: 404 });
    }
    const { staff_id, requestable_type } = requestResult[0];

    // 3. Update the request status
    await db.query(
      `UPDATE requests SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [session.userId, requestId]
    );

    // 4. Create the notification for the employee who made the request
    await createNotificationForRequester(
        staff_id,
        `Your ${requestable_type} request (#${requestId}) has been approved.`,
        `/dashboard/my-requests`
    );

    return NextResponse.json({ message: 'Request approved successfully.' });
  } catch (error) {
    console.error("Approve request error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}