// app/api/staff/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2/promise';

// Define an interface for the full staff member data
interface StaffDataPacket extends RowDataPacket {
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  profile_image_url: string;
  created_at: Date; // Or string, depending on your DB setup
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { staffId } = await req.json();
  if (!staffId) {
    return NextResponse.json({ message: 'staffId is required' }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Use our specific interface for the query result
    const [rows] = await connection.query<StaffDataPacket[]>(
      'SELECT * FROM staff WHERE id = ?',
      [staffId]
    );

    const user = rows[0]; // No 'any' cast needed
    if (!user) {
      // It's better to rollback and return a 404 if the user isn't found
      await connection.rollback();
      return NextResponse.json({ message: 'Staff not found' }, { status: 404 });
    }

    // Archive into staff_history
    await connection.query(
      `INSERT INTO staff_history (
        staff_id, full_name, email, job_title, department, profile_image_url,
        archived_by, original_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffId,
        user.full_name,
        user.email,
        user.job_title,
        user.department,
        user.profile_image_url,
        session.userId,
        user.created_at
      ]
    );

    // Delete user from staff
    await connection.query('DELETE FROM staff WHERE id = ?', [staffId]);

    await connection.commit();
    return NextResponse.json({ message: 'Staff deleted and archived.' }, { status: 200 });

  } catch (error) { // FIX 2: Removed ': any'
    await connection.rollback();
    console.error('Deletion error:', error);
    // This is a safe way to get a message from an 'unknown' error
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff';
    return NextResponse.json({ message: errorMessage }, { status: 500 });

  } finally {
    connection.release();
  }
}