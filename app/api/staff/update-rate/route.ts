// app/api/staff/update-rate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Secure this endpoint with the 'manage_payroll_settings' permission
    const hasPermission = await userHasPermission(session.userId, 'manage_payroll_settings');
    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { staffId, newRate } = await req.json();

    if (!staffId || newRate === undefined || newRate === null) {
        return NextResponse.json({ message: 'Staff ID and a new rate are required.' }, { status: 400 });
    }

    if (typeof newRate !== 'number' || newRate < 0) {
        return NextResponse.json({ message: 'Invalid rate provided. Must be a non-negative number.' }, { status: 400 });
    }

    try {
        await db.query(
            'UPDATE staff SET hourly_rate = ? WHERE id = ?',
            [newRate, staffId]
        );
        return NextResponse.json({ message: `Successfully updated hourly rate for staff ID ${staffId}.` });
    } catch (error) {
        console.error("Error updating hourly rate:", error);
        return NextResponse.json({ message: "Database update failed." }, { status: 500 });
    }
}