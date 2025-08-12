// app/api/notifications/mark-as-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); }

    const { key } = await req.json();
    if (!key) { return NextResponse.json({ message: 'A notification key is required.' }, { status: 400 }); }

    const keyToUrlMap: { [key: string]: string } = {
        'review_requests': '/dashboard/requests/review',
        'my_requests': '/dashboard/my-requests',
    };
    const linkUrl = keyToUrlMap[key];
    if (!linkUrl) { return NextResponse.json({ message: 'Invalid notification key.' }, { status: 400 }); }

    try {
        // --- Step 1: Mark the relevant notifications as read ---
        const updateQuery = `UPDATE notifications SET is_read = TRUE WHERE recipient_staff_id = ? AND link_url = ? AND is_read = FALSE`;
        await db.query(updateQuery, [session.userId, linkUrl]);
        
        // --- Step 2: Re-fetch ALL remaining unread notifications ---
        const [remainingNotifications] = await db.query<RowDataPacket[]>(
            "SELECT * FROM notifications WHERE recipient_staff_id = ? AND is_read = FALSE ORDER BY created_at DESC",
            [session.userId]
        );

        // --- Step 3: Send the fresh list back to the client ---
        return NextResponse.json({ 
            message: "Notifications marked as read.",
            remainingNotifications: remainingNotifications 
        });

    } catch (error) {
        console.error("Mark as read error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}