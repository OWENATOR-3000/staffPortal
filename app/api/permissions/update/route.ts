// app/api/permissions/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session'; // Import session helper
import { userHasPermission } from '@/lib/auth'; // Import our new permission checker

export async function POST(req: NextRequest) {
    // 1. Get the current user's session
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // 2. Perform the permission check
    const hasPermission = await userHasPermission(session.userId, 'manage_permissions');
    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    // If the check passes, proceed with the original logic
    const { roleId, permissionIds } = await req.json();

    if (!roleId || !Array.isArray(permissionIds)) {
        return NextResponse.json({ message: 'roleId and permissionIds array are required.' }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Delete all existing permissions for this role
        await connection.query('DELETE FROM role_permission WHERE role_id = ?', [roleId]);

        // Insert the new set of permissions if any were provided
        if (permissionIds.length > 0) {
            const values = permissionIds.map(permissionId => [roleId, permissionId]);
            await connection.query('INSERT INTO role_permission (role_id, permission_id) VALUES ?', [values]);
        }

        await connection.commit();
        return NextResponse.json({ message: 'Permissions updated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error("Error updating permissions:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}