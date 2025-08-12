// app/api/requests/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { createNotificationForApprovers } from '@/lib/auth';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import { RowDataPacket } from 'mysql2';
import { generateLeavePdf } from '@/python/pdf-utils'; // new utility

async function ensureUploadDirExists() {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      await mkdir(uploadDir, { recursive: true });
    } else {
      throw e;
    }
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const [userResult] = await db.query<RowDataPacket[]>('SELECT full_name FROM staff WHERE id = ?', [session.userId]);
  const userName = userResult[0]?.full_name || 'An employee';

  const connection = await db.getConnection();
  try {
    const formData = await req.formData();
    const supervisorName = formData.get('supervisorName') as string;
    const reasonType = formData.get('reasonType') as string;
    const reasonDetails = formData.get('reasonDetails') as string | null;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const numberOfHours = formData.get('numberOfHours') as string | null;
    const comments = formData.get('comments') as string | null;
    const employeeSignatureName = formData.get('employeeSignatureName') as string;
    const supervisorSignature = formData.get('supervisorSignature') as string | null;
    const attachment = formData.get('attachment') as File | null;

    if (!reasonType || !startDate || !endDate || !employeeSignatureName) {
      return NextResponse.json({ message: 'Reason, dates, and signature are required.' }, { status: 400 });
    }

    await connection.beginTransaction();

    let documentId: number | null = null;
    let filePath: string | null = null;
    if (attachment && attachment.size > 0) {
      await ensureUploadDirExists();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const uniqueFilename = `${uniqueSuffix}-${attachment.name.replace(/\s+/g, '-')}`;
      filePath = path.join(process.cwd(), 'uploads', uniqueFilename);
      const bytes = await attachment.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      const [docResult] = await connection.query(
        `INSERT INTO documents (staff_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)`,
        [session.userId, attachment.name, filePath, attachment.type, attachment.size]
      );
      documentId = (docResult as any).insertId;
    }

    const [leaveResult] = await connection.query(
      `INSERT INTO leave_requests (supervisor_name, reason_type, reason_details, start_date, end_date, number_of_hours, comments, document_id, employee_signature_name, supervisor_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [supervisorName, reasonType, reasonDetails, startDate, endDate, numberOfHours, comments, documentId, employeeSignatureName, supervisorSignature]
    );
    const newLeaveRequestId = (leaveResult as any).insertId;

    const [masterRequestResult] = await connection.query(
      `INSERT INTO requests (staff_id, requestable_id, requestable_type, status) VALUES (?, ?, 'Leave', 'pending')`,
      [session.userId, newLeaveRequestId]
    );

    const pdfPath = await generateLeavePdf({
      employeeName: userName,
      date: new Date().toLocaleDateString(),
      supervisorName,
      reasonType,
      reasonDetails,
      startDate,
      endDate,
      numberOfHours,
      comments,
      employeeSignatureName,
      supervisorSignature
    });

    await connection.commit();

    await createNotificationForApprovers(
      `${userName} has submitted a new Leave Request.`,
      `/dashboard/requests/review`
    );

    return NextResponse.json({ message: 'Leave request submitted successfully!', pdf: pdfPath }, { status: 201 });
  } catch (error: any) {
    await connection.rollback();
    console.error("Leave request submission failed:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    connection.release();
  }
}
