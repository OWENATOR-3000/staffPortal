// app/api/requests/salary-advance/route.ts
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

    // Use our specific interface for the user query
    const [userResult] = await db.query<UserFullNamePacket[]>('SELECT full_name FROM staff WHERE id = ?', [session.userId]);
    const userName = userResult[0]?.full_name || 'An employee';

    const formData = await req.formData();
    const amount = formData.get('amount') as string;
    const paidOnDate = formData.get('paidOnDate') as string;
    const reason = formData.get('reason') as string;
    const signature = formData.get('signature') as string;

    if (!amount || !paidOnDate || !reason || !signature) {
        return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [advanceResult] = await connection.query(
            `INSERT INTO salary_advance_requests (amount_requested, requested_repayment_date, reason)
             VALUES (?, ?, ?)`,
            [parseFloat(amount), paidOnDate, reason]
        );
        // FIX 1: Use the specific 'OkPacket' type instead of 'any'
        const newAdvanceRequestId = (advanceResult as OkPacket).insertId;

        // The result of this query is not needed, so we don't assign it
        await connection.query(
            `INSERT INTO requests (staff_id, requestable_id, requestable_type, status)
             VALUES (?, ?, 'Salary Advance', 'pending')`,
            [session.userId, newAdvanceRequestId]
        );
        
        await connection.commit();

        await createNotificationForApprovers(
            `${userName} has submitted a new Salary Advance Request.`,
            `/dashboard/requests/review`
        );
        
        return NextResponse.json({ message: 'Salary advance request submitted successfully!' }, { status: 201 });

    } catch (error) { // FIX 2: Removed the ': any' type from the error object
        await connection.rollback();
        console.error("Salary advance submission failed:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        connection.release();
    }
}