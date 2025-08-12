// app/api/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get('roleId');

    try {
        // Fetch all possible permissions from the database
        const [allPermissions] = await db.query<RowDataPacket[]>('SELECT id, name FROM permissions ORDER BY name');

        // Fetch all available roles from the database
        const [allRoles] = await db.query<RowDataPacket[]>('SELECT id, name FROM roles ORDER BY name');
        
        let assignedPermissionIds: number[] = [];
        // If a specific roleId is provided in the URL, fetch its assigned permissions
        if (roleId) {
            const [assigned] = await db.query<RowDataPacket[]>(
                'SELECT permission_id FROM role_permission WHERE role_id = ?',
                [roleId]
            );
            assignedPermissionIds = assigned.map(p => p.permission_id);
        }

        // Return the full payload
        return NextResponse.json({
            allPermissions,
            allRoles,
            assignedPermissionIds,
        });

    } catch (error) {
        console.error("Error fetching permissions data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}