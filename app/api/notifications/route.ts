// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';

// Fetches unread notifications for the logged-in user
export async function GET(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); }

    try {
        const [notifications] = await db.query(
            "SELECT * FROM notifications WHERE recipient_staff_id = ? AND is_read = FALSE ORDER BY created_at DESC",
            [session.userId]
        );
        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}