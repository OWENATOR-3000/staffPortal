// app/api/requests/overtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { createNotificationForApprovers } from '@/lib/auth';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(req: NextRequest) {
    // Corrected session handling
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData();
    const overtimeDate = formData.get('overtimeDate') as string;
    const hoursWorked = formData.get('hoursWorked') as string;
    const reason = formData.get('reason') as string;
    // 1. Get the new overtimeType field from the form
    const overtimeType = formData.get('overtimeType') as string;

    if (!overtimeDate || !hoursWorked || !reason || !overtimeType) {
        return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // Fetch user's name for the notification message
const [userResult] = await db.query<RowDataPacket[]>('SELECT full_name FROM staff WHERE id = ?', [session.userId]);
const userName = userResult[0]?.full_name || 'An employee';
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 2. Update the INSERT statement to include the new column
        const [overtimeResult] = await connection.query(
            `INSERT INTO overtime_requests (overtime_date, hours_worked, reason, overtime_type) VALUES (?, ?, ?, ?)`,
            [overtimeDate, parseFloat(hoursWorked), reason, overtimeType]
        );
        const newOvertimeRequestId = (overtimeResult as any).insertId;

        await connection.query(
            `INSERT INTO requests (staff_id, requestable_id, requestable_type, status)
             VALUES (?, ?, 'Overtime', 'pending')`,
            [session.userId, newOvertimeRequestId]
        );
        
        await connection.commit();

        // 3. Create a notification for approvers
        await createNotificationForApprovers(
    `${userName} has submitted a new Overtime Request.`,
    `/dashboard/requests/review`
);
        return NextResponse.json({ message: 'Overtime request submitted successfully!' }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        console.error("Overtime submission failed:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        connection.release();
    }
}