// app/api/user-permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    try {
        const [allPermissions] = await db.query<RowDataPacket[]>('SELECT id, name FROM permissions ORDER BY name');
        const [allStaff] = await db.query<RowDataPacket[]>('SELECT id, full_name FROM staff ORDER BY full_name');
        
        let assignedPermissionIds: number[] = [];
        if (staffId) {
            const [assigned] = await db.query<RowDataPacket[]>('SELECT permission_id FROM user_permission WHERE staff_id = ?', [staffId]);
            assignedPermissionIds = assigned.map(p => p.permission_id);
        }

        return NextResponse.json({ allPermissions, allStaff, assignedPermissionIds });

    } catch (error) {
        console.error("Error fetching user permissions data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}