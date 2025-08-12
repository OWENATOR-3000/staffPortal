// app/api/requests/complaint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { createNotificationForApprovers } from '@/lib/auth';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user's name for the notification message
    // Add this near the top of each POST function
const [userResult] = await db.query<RowDataPacket[]>('SELECT full_name FROM staff WHERE id = ?', [session.userId]);
const userName = userResult[0]?.full_name || 'An employee';

    const formData = await req.formData();
    const incidentDate = formData.get('incidentDate') as string;
    const incidentTime = formData.get('incidentTime') as string;
    const location = formData.get('location') as string;
    const complaintNature = formData.get('complaintNature') as string;
    const complaintNatureOther = formData.get('complaintNatureOther') as string;
    const description = formData.get('description') as string;
    const desiredResolution = formData.get('desiredResolution') as string;
    const acknowledgment = formData.get('acknowledgment') as string;

    if (!incidentDate || !complaintNature || !description || acknowledgment !== 'on') {
        return NextResponse.json({ message: 'Required fields are missing or acknowledgment not confirmed.' }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert details into the `complaints` table
        const [complaintResult] = await connection.query(
            `INSERT INTO complaints (incident_date, incident_time, location, complaint_nature, complaint_nature_other, description, desired_resolution, acknowledgment) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [incidentDate, incidentTime || null, location || null, complaintNature, complaintNature === 'Other' ? complaintNatureOther : null, description, desiredResolution || null, true]
        );
        const newComplaintId = (complaintResult as any).insertId;

        // 2. Insert master request into the `requests` table
        await connection.query(
            `INSERT INTO requests (staff_id, requestable_id, requestable_type, status)
             VALUES (?, ?, 'Complaint', 'pending')`,
            [session.userId, newComplaintId]
        );
        
        await connection.commit();

        // 3. Create a notification for HR or relevant department
        await createNotificationForApprovers(
    `${userName} has filed a new Complaint.`,
    `/dashboard/requests/review`
);
        return NextResponse.json({ message: 'Complaint submitted successfully. HR will review it shortly.' }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        console.error("Complaint submission failed:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } finally {
        connection.release();
    }
}