// app/api/user-permissions/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await userHasPermission(session.userId, 'manage_permissions');
    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { staffId, permissionIds } = await req.json();

    if (!staffId || !Array.isArray(permissionIds)) {
        return NextResponse.json({ message: 'staffId and permissionIds array are required.' }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM user_permission WHERE staff_id = ?', [staffId]);
        if (permissionIds.length > 0) {
            const values = permissionIds.map(id => [staffId, id]);
            await connection.query('INSERT INTO user_permission (staff_id, permission_id) VALUES ?', [values]);
        }
        await connection.commit();
        return NextResponse.json({ message: 'User permissions updated successfully!' });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating user permissions:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}