// app/api/requests/loan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { createNotificationForApprovers } from '@/lib/auth';
import { OkPacket, RowDataPacket } from 'mysql2/promise'; // Import OkPacket

// Interface for the user name query for better type safety
interface UserFullNamePacket extends RowDataPacket {
    full_name: string;
}

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Use our specific interface for the query
    const [userResult] = await db.query<UserFullNamePacket[]>('SELECT full_name FROM staff WHERE id = ?', [session.userId]);
    const userName = userResult[0]?.full_name || 'An employee';

    const formData = await req.formData();
    const amount = formData.get('amount') as string;
    const loanType = formData.get('loanType') as string;
    const reason = formData.get('reason') as string;
    const repaymentTerms = formData.get('repaymentTerms') as string;
    const signature = formData.get('signature') as string;

    if (!amount || !loanType || !reason || !signature) {
        return NextResponse.json({ message: 'Amount, loan type, reason, and signature are required.' }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [loanResult] = await connection.query(
            `INSERT INTO loan_requests (amount_requested, loan_type, reason, proposed_repayment_terms, employee_signature_name)
             VALUES (?, ?, ?, ?, ?)`,
            [parseFloat(amount), loanType, reason, repaymentTerms || null, signature]
        );
        // FIX 1: Use the specific 'OkPacket' type instead of 'any'
        const newLoanRequestId = (loanResult as OkPacket).insertId;

        // The result of this query is not needed, so we don't assign it
        await connection.query(
            `INSERT INTO requests (staff_id, requestable_id, requestable_type, status)
             VALUES (?, ?, 'Loan', 'pending')`,
            [session.userId, newLoanRequestId]
        );
        
        await connection.commit();

        await createNotificationForApprovers(
            `${userName} has submitted a new Loan Request.`,
            `/dashboard/requests/review`
        );

        return NextResponse.json({ message: 'Loan request submitted successfully!' }, { status: 201 });

    } catch (error) { // FIX 2: Removed the ': any' type from the error object
        await connection.rollback();
        console.error("Loan request submission failed:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        connection.release();
    }
}