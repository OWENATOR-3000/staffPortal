// app/api/notifications/route.ts
import { NextResponse } from 'next/server'; // NextRequest is no longer needed
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2'; // Import for interface extension

// NEW: Define an interface for the notification data for type safety
interface NotificationPacket extends RowDataPacket {
  id: number;
  recipient_staff_id: number;
  message: string;
  is_read: boolean;
  link_url: string | null;
  created_at: string; // Or `Date` if you have date parsing configured
}

// Fetches unread notifications for the logged-in user
// FIXED: Removed the unused `_req: NextRequest` parameter
export async function GET() {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); }

    try {
        // IMPROVED: Added the NotificationPacket type to the query
        const [notifications] = await db.query<NotificationPacket[]>(
            "SELECT * FROM notifications WHERE recipient_staff_id = ? AND is_read = FALSE ORDER BY created_at DESC",
            [session.userId]
        );
        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}