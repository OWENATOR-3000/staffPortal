// app/api/staff/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { hashPassword, comparePassword } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
        return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ message: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    try {
        // 1. Get the user's current hashed password from the database
        const [users] = await db.query<RowDataPacket[]>('SELECT password_hash FROM staff WHERE id = ?', [session.userId]);
        if (users.length === 0) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }
        const currentHash = users[0].password_hash;

        // 2. Verify that the 'currentPassword' provided matches the one in the DB
        const isPasswordValid = await comparePassword(currentPassword, currentHash);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Incorrect current password.' }, { status: 403 });
        }

        // 3. Hash the new password
        const newHashedPassword = await hashPassword(newPassword);

        // 4. Update the database with the new hashed password
        await db.query(
            'UPDATE staff SET password_hash = ? WHERE id = ?',
            [newHashedPassword, session.userId]
        );

        return NextResponse.json({ message: 'Password updated successfully!' });

    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ message: "An error occurred." }, { status: 500 });
    }
}