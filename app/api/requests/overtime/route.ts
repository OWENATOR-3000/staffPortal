// app/api/requests/overtime/route.ts
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

    const formData = await req.formData();
    const overtimeDate = formData.get('overtimeDate') as string;
    const hoursWorked = formData.get('hoursWorked') as string;
    const reason = formData.get('reason') as string;
    const overtimeType = formData.get('overtimeType') as string;

    if (!overtimeDate || !hoursWorked || !reason || !overtimeType) {
        return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // Use our specific interface for the user query
    const [userResult] = await db.query<UserFullNamePacket[]>('SELECT full_name FROM staff WHERE id = ?', [session.userId]);
    const userName = userResult[0]?.full_name || 'An employee';
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [overtimeResult] = await connection.query(
            `INSERT INTO overtime_requests (overtime_date, hours_worked, reason, overtime_type) VALUES (?, ?, ?, ?)`,
            [overtimeDate, parseFloat(hoursWorked), reason, overtimeType]
        );
        // FIX 1: Use the specific 'OkPacket' type instead of 'any'
        const newOvertimeRequestId = (overtimeResult as OkPacket).insertId;

        // The result of this query is not needed, so we don't assign it
        await connection.query(
            `INSERT INTO requests (staff_id, requestable_id, requestable_type, status)
             VALUES (?, ?, 'Overtime', 'pending')`,
            [session.userId, newOvertimeRequestId]
        );
        
        await connection.commit();

        await createNotificationForApprovers(
            `${userName} has submitted a new Overtime Request.`,
            `/dashboard/requests/review`
        );
        
        return NextResponse.json({ message: 'Overtime request submitted successfully!' }, { status: 201 });

    } catch (error) { // FIX 2: Removed the ': any' type from the error object
        await connection.rollback();
        console.error("Overtime submission failed:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        connection.release();
    }
}