// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session'; // We import our corrected function
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  // Await getSessionUser() since it returns a Promise.
  const session = await getSessionUser(); 

  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  // Because session is not a Promise, accessing session.userId is now valid!
  // The TypeScript error is gone.
  const [users]: any[] = await db.query(
    'SELECT id, full_name, email, (SELECT name FROM roles r JOIN staff_role sr ON r.id = sr.role_id WHERE sr.staff_id = s.id) as role FROM staff s WHERE id = ?',
    [session.userId]
  );
  
  if(users.length === 0) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: users[0] });
}