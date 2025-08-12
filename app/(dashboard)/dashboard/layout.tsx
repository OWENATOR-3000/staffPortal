// app/dashboard/layout.tsx
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import { verifyJwt } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DbUser extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  profile_image_url: string | null;
}

async function getLayoutData() {
  const token = (await cookies()).get('authToken')?.value;
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  const [users] = await db.query<DbUser[]>('SELECT id, full_name, email, profile_image_url FROM staff WHERE id = ?', [payload.userId]);
  if (users.length === 0) return null;
  const dbUser = users[0];

  const permissionsQuery = `
    SELECT DISTINCT p.name FROM permissions p WHERE 
    EXISTS (SELECT 1 FROM staff_role sr JOIN role_permission rp ON sr.role_id = rp.role_id WHERE sr.staff_id = ? AND rp.permission_id = p.id) OR 
    EXISTS (SELECT 1 FROM user_permission up WHERE up.staff_id = ? AND up.permission_id = p.id);
  `;
  const [permissions] = await db.query<RowDataPacket[]>(permissionsQuery, [dbUser.id, dbUser.id]);

  // --- THIS IS THE CRITICAL NOTIFICATION LOGIC ---
  const [notifResults] = await db.query<RowDataPacket[]>(
      `SELECT link_url, COUNT(id) as count 
       FROM notifications 
       WHERE recipient_staff_id = ? AND is_read = FALSE 
       GROUP BY link_url`,
      [dbUser.id]
  );
  
  const notificationCounts: { [key: string]: number } = {};
  if (notifResults.length > 0) {
      for (const row of notifResults) {
          if (row.link_url === '/dashboard/requests/review') {
              notificationCounts['review_requests'] = row.count;
          } 
          // This block ensures the count for "My Requests" is correctly created
          else if (row.link_url === '/dashboard/my-requests') {
              notificationCounts['my_requests'] = row.count;
          }
      }
  }
  
  const finalUserObject = {
      id: dbUser.id,
      fullName: dbUser.full_name,
      email: dbUser.email,
      profile_image_url: dbUser.profile_image_url,
      permissions: permissions.map((p: any) => p.name)
  };

  return { 
      user: finalUserObject,
      notificationCounts
  };
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const data = await getLayoutData();
  if (!data?.user) { redirect('/login'); }
  const { user, notificationCounts } = data;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-white-400">
      <Sidebar userPermissions={user.permissions} notificationCounts={notificationCounts} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
