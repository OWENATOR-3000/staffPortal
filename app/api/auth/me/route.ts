// app/api/auth/me/route.ts
import { NextResponse } from 'next/server'; // NextRequest is no longer needed
import { getSessionUser } from '@/lib/session';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Define an interface for the user data returned by the specific query
interface UserMeData extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

// FIXED: Removed the unused `_req: NextRequest` parameter
export async function GET() {
  const session = await getSessionUser(); 

  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const [users] = await db.query<UserMeData[]>(
    'SELECT id, full_name, email, (SELECT name FROM roles r JOIN staff_role sr ON r.id = sr.role_id WHERE sr.staff_id = s.id) as role FROM staff s WHERE id = ?',
    [session.userId]
  );
  
  if(users.length === 0) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: users[0] });
}