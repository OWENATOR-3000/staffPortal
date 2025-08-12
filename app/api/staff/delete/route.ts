import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { staffId } = await req.json();

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get user data before deletion
    const [rows] = await connection.query(
      'SELECT * FROM staff WHERE id = ?',
      [staffId]
    );
    const user = (rows as any)[0];
    if (!user) {
      throw new Error('Staff not found');
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
  } catch (error: any) {
    await connection.rollback();
    console.error('Deletion error:', error);
    return NextResponse.json({ message: error.message || 'Failed to delete staff' }, { status: 500 });
  } finally {
    connection.release();
  }
}
