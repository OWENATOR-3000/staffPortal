// app/api/requests/my-requests/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        // This query fetches all requests for the current user and joins with
        // the details tables to get a summary for the list view.
        const query = `
            SELECT 
                r.id, 
                r.requestable_type, 
                r.status, 
                r.created_at, 
                r.rejection_reason,
                -- Use COALESCE to get a single, clean detail string
                COALESCE(
                    DATE_FORMAT(lr.start_date, '%Y-%m-%d'), 
                    CONCAT('N$ ', FORMAT(sar.amount_requested, 2)),
                    CONCAT(otr.hours_worked, ' hrs'),
                    c.complaint_nature,
                    ln.loan_type
                ) as details
            FROM requests r
            LEFT JOIN leave_requests lr ON r.requestable_id = lr.id AND r.requestable_type = 'Leave'
            LEFT JOIN salary_advance_requests sar ON r.requestable_id = sar.id AND r.requestable_type = 'Salary Advance'
            LEFT JOIN overtime_requests otr ON r.requestable_id = otr.id AND r.requestable_type = 'Overtime'
            LEFT JOIN complaints c ON r.requestable_id = c.id AND r.requestable_type = 'Complaint'
            LEFT JOIN loan_requests ln ON r.requestable_id = ln.id AND r.requestable_type = 'Loan'
            WHERE r.staff_id = ?
            ORDER BY r.created_at DESC;
        `;
        
        const [requests] = await db.query<RowDataPacket[]>(query, [session.userId]);

        return NextResponse.json({ requests });

    } catch (error) {
        console.error("Error fetching my-requests:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}