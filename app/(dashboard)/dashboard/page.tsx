// app/dashboard/page.tsx


import CalendarWidget from '@/components/dashboard/CalendarWidget';
import ProfileWelcome from '@/components/dashboard/ProfileWelcome';
import { getSessionUser } from '@/lib/session';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { RowDataPacket } from 'mysql2';
import TimeWidgetPlain from '@/components/dashboard/TimeWidget';
import ChatWidget from '@/components/dashboard/ChatWidget';

// --- HELPER COMPONENT: InfoCard ---
function InfoCard({ title, value, colorClass }: { title: string, value: string, colorClass: string }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${colorClass}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>
    </div>
  );
}

// --- HELPER COMPONENT: RequestStatusCard ---
function RequestStatusCard({ title, status, date, colorClass }: { title: string, status: string, date: string, colorClass:string }) {
  const statusColors: { [key: string]: string } = {
    approved: 'text-green-600',
    rejected: 'text-red-600',
    pending: 'text-yellow-600',
    sent: 'text-green-600', // Added 'Sent' status style
    unsent: 'text-gray-600',
    'n/a': 'text-gray-400',
  };
  const statusColorClass = statusColors[status.toLowerCase()] || 'text-gray-700';
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${colorClass}`}>
      <h4 className="text-xs font-medium text-gray-500">{title}</h4>
      <p className={`text-xl font-bold mt-1 capitalize ${statusColorClass}`}>{status}</p>
      <p className="text-xs text-gray-600 mt-2">{status === 'N/A' ? '' : `Sent: ${date}`}</p>
    </div>
  )
}

// --- DATA FETCHING FUNCTIONS ---
async function getTodaysClockInTime(userId: number): Promise<Date | null> {
  const query = `
    SELECT event_time FROM attendance_log 
    WHERE staff_id = ? AND event_type = 'clock_in' AND DATE(event_time) = CURDATE() 
    ORDER BY event_time ASC LIMIT 1;
  `;
  const [results] = await db.query<RowDataPacket[]>(query, [userId]);
  if (results.length > 0) {
    return results[0].event_time as Date;
  }
  return null;
}

async function getUserDashboardData(userId: number) {
  const [results] = await db.query<RowDataPacket[]>(
    'SELECT first_name, profile_image_url FROM staff WHERE id = ?', [userId]
  );
  if (results.length > 0) {
    return {
        userName: results[0].first_name || 'User',
        profileImageUrl: results[0].profile_image_url || null,
    };
  }
  return { userName: 'User', profileImageUrl: null }; // Fallback
}

async function getLatestRequests(userId: number) {
    const query = `
      SELECT requestable_type, status, created_at
      FROM (
        SELECT 
          requestable_type, 
          status, 
          created_at,
          ROW_NUMBER() OVER(PARTITION BY requestable_type ORDER BY created_at DESC) as rn
        FROM requests
        WHERE staff_id = ?
      ) as RankedRequests
      WHERE rn = 1;
    `;
    const [results] = await db.query<RowDataPacket[]>(query, [userId]);

    const findLatest = (type: string) => {
        const req = results.find(r => r.requestable_type === type);
        return req 
            ? { status: req.status, date: new Date(req.created_at).toLocaleDateString() } 
            : { status: 'N/A', date: '-' };
    };

    return {
        leave: findLatest('Leave'),
        overtime: findLatest('Overtime'),
    };
}

async function getPayrollInfo(userId: number) {
    const query = `
        SELECT total_pay FROM payroll_history 
        WHERE staff_id = ? ORDER BY payment_date DESC LIMIT 1;
    `;
    const [results] = await db.query<RowDataPacket[]>(query, [userId]);
    if (results.length > 0) {
        const amount = parseFloat(results[0].total_pay);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(amount).replace('$', 'N$ ');
    }
    return "N/A";
}

async function getLatestReportStatus(userId: number) {
    const query = `
        SELECT uploaded_at FROM documents 
        WHERE staff_id = ? AND category = 'Report' 
        ORDER BY uploaded_at DESC LIMIT 1;
    `;
    const [results] = await db.query<RowDataPacket[]>(query, [userId]);
    if (results.length > 0) {
        return { 
            status: 'Sent', 
            date: new Date(results[0].uploaded_at).toLocaleDateString() 
        };
    }
    return { status: 'N/A', date: '-' };
}


// --- MAIN DASHBOARD PAGE ---
export default async function DashboardPage() {
  const session = await getSessionUser(); 
  if (!session) {
    redirect('/login');
  }

  // Fetch all dashboard data in parallel for best performance
  const [userData, clockInTime, latestRequests, payrollInfo, reportStatus] = await Promise.all([
    getUserDashboardData(session.userId),
    getTodaysClockInTime(session.userId),
    getLatestRequests(session.userId),
    getPayrollInfo(session.userId),
    getLatestReportStatus(session.userId)
  ]);

  const clockInDisplayValue = clockInTime 
    ? clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : "No clock-in today";

  return (
    <>
     <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
    <p className="text-gray-600">Your portal overview.</p>
  </div>
 
     <div className="text-6xl font-bold text-gray-800">
    <TimeWidgetPlain />
  </div>
  
</div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileWelcome 
                userName={userData.userName} 
                profileImageUrl={userData.profileImageUrl} 
            />
            <div className="bg-white p-4 rounded-lg shadow-md">
                <CalendarWidget />
            </div>
        </div>

        <div className="flex flex-col gap-6">
          <InfoCard 
            title="Today's Clock-In Time" 
            value={clockInDisplayValue} 
            colorClass="border-green-500" 
          />
          <InfoCard 
            title="Your Last Net Pay"
            value={payrollInfo} 
            colorClass="border-yellow-500" 
          />
          <RequestStatusCard 
            title="Latest Report Sent"
            status={reportStatus.status}
            date={reportStatus.date}
            colorClass="border-gray-400" 
          />
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <RequestStatusCard 
            title="Latest Leave Request" 
            status={latestRequests.leave.status} 
            date={latestRequests.leave.date} 
            colorClass="border-red-400" 
        />
        <RequestStatusCard 
            title="Latest Overtime Request" 
            status={latestRequests.overtime.status} 
            date={latestRequests.overtime.date} 
            colorClass="border-blue-400" 
        />

         <ChatWidget />
      </div>
    </>
  );
}