// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

// THIS IS THE CORRECTED HELPER FUNCTION WITH ALL LOGIC
async function getFullRequestDetails(requestId: string) {
    // Get main request and user info
    const [requestData] = await db.query<RowDataPacket[]>(
        `SELECT 
            req.*, 
            s.full_name as staff_name, 
            s.email as staff_email,
            r.full_name as reviewer_name 
         FROM requests req
         JOIN staff s ON req.staff_id = s.id
         LEFT JOIN staff r ON req.reviewed_by = r.id
         WHERE req.id = ?`,
        [requestId]
    );

    const request = (requestData as any)[0];
    if (!request) {
        return null;
    }

    let details = {};
    // Fetch details based on the request type
    if (request.requestable_type === 'Leave') {
        const [leaveDetails] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [request.requestable_id]);
        details = (leaveDetails as any)[0] || {};
    } 
    else if (request.requestable_type === 'Salary Advance') {
        const [advanceDetails] = await db.query('SELECT * FROM salary_advance_requests WHERE id = ?', [request.requestable_id]);
        details = (advanceDetails as any)[0] || {};
    }
    // THIS ELSE IF BLOCK IS THE FIX
    else if (request.requestable_type === 'Overtime') {
        const [overtimeDetails] = await db.query<RowDataPacket[]>('SELECT * FROM overtime_requests WHERE id = ?', [request.requestable_id]);
        if (overtimeDetails.length > 0) details = overtimeDetails[0];
    }

    // --- THIS IS THE MISSING LOGIC BLOCK ---
    else if (request.requestable_type === 'Complaint') {
        const [complaintDetails] = await db.query<RowDataPacket[]>('SELECT * FROM complaints WHERE id = ?', [request.requestable_id]);
        if (complaintDetails.length > 0) details = complaintDetails[0];
    }

    else if (request.requestable_type === 'Loan') {
        const [loanDetails] = await db.query<RowDataPacket[]>('SELECT * FROM loan_requests WHERE id = ?', [request.requestable_id]);
        if (loanDetails.length > 0) details = loanDetails[0];
    }

    return { ...request, details };
}

// MAIN GET HANDLER
export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const requestData = await getFullRequestDetails(params.id);
    
    // This check will now pass for Overtime requests because the helper function is complete
    if (!requestData || Object.keys(requestData.details).length === 0) {
        return NextResponse.json({ message: 'Request or its details not found' }, { status: 404 });
    }

    return NextResponse.json(requestData);

  } catch (error) {
    console.error("Fetch request details error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}