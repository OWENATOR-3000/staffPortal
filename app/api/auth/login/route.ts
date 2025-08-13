import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { comparePassword, createJwt } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

// Define an interface for the data structure returned by your 'login_user' procedure
interface UserFromDb extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role_name: string;
  last_event_type: 'clock_in' | 'clock_out' | null;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // 🔁 1. Call stored procedure to get user + last_event_type
    const [userRows] = await db.query<[UserFromDb[]]>('CALL login_user(?)', [email]);
    const users = userRows[0]; // CALL returns [ [rows], ... ]

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const user = users[0];

    // 🔐 2. Compare passwords
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    // 🕒 3. Prevent multiple clock-ins
    if (user.last_event_type === 'clock_in') {
      return NextResponse.json(
        { message: 'You are already clocked in. Please clock out before clocking in again.' },
        { status: 409 }
      );
    }

    // ⏺️ 4. Record the Clock-In Event
    await db.query('INSERT INTO attendance_log (staff_id, event_type) VALUES (?, ?)', [user.id, 'clock_in']);

    // 🪪 5. JWT creation and cookie
    const token = createJwt({
      userId: user.id,
      role: user.role_name,
      user: undefined
    });

    (await cookies()).set('authToken', token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      secure: false, // Always use secure cookies in production
      maxAge: 8 * 60 * 60,
      path: '/',
      sameSite: 'strict',
    });

    // ✅ 6. Return user info
    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
      },
    });

  } catch (error) {
    console.error('Login API CATCH BLOCK Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
