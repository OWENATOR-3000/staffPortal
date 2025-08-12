// components/dashboard/Sidebar.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, ChevronRight, FileText, UserCheck, DollarSign, Wallet, Folder, Library, CheckSquare, HandCoins, Clock, MessageSquareWarning, ShieldCheck, UserCog, CalendarClock, Coins, Landmark, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavLink {
    key?: string;
    name: string;
    href: string;
    icon: React.ElementType;
    permission: string | null;
    notificationKey: string | null;
}

const ALL_NAV_LINKS: NavLink[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, permission: null, notificationKey: null },
  { name: 'My Attendance', href: '/dashboard/my-attendance', icon: Clock, permission: 'view_own_attendance', notificationKey: null },
   { name: 'My Requests', href: '/dashboard/my-requests', icon: History, permission: 'create_requests',notificationKey: 'my_requests' },
  { name: 'Manage Staff', href: '/dashboard/staff', icon: UserCheck, permission: 'manage_staff', notificationKey: null },
  { name: 'Attendance Log', href: '/dashboard/attendance', icon: CalendarClock, permission: 'view_attendance_log', notificationKey: null },
   { name: 'Adjust Time', href: '/dashboard/attendance/adjust', icon: UserCog, permission: 'manage_staff', notificationKey: null  },
  { name: 'Role Permissions', href: '/dashboard/admin/permissions/roles', icon: ShieldCheck, permission: 'manage_permissions', notificationKey: null },
  { name: 'User Permissions', href: '/dashboard/admin/permissions/users', icon: UserCog, permission: 'manage_permissions', notificationKey: null },
  { name: 'My Documents', href: '/dashboard/documents', icon: Folder, permission: 'upload_documents', notificationKey: null },
  { name: 'My Payroll', href: '/dashboard/payroll-calculator/history', icon: Wallet, permission: 'view_own_payroll', notificationKey: null }, 
  { name: 'Company Documents', href: '/dashboard/documents/all', icon: Library, permission: 'view_all_documents', notificationKey: null },
  { name: 'Review Requests', href: '/dashboard/requests/review', icon: FileText, permission: 'approve_requests', notificationKey: 'review_requests' },
  { name: 'Request Leave', href: '/dashboard/requests/leave/new', icon: CheckSquare, permission: 'create_requests', notificationKey: null },
  { name: 'Request Loan', href: '/dashboard/requests/loan/new', icon: Landmark, permission: 'create_requests', notificationKey: null },
  { name: 'Request Advance', href: '/dashboard/requests/salary-advance/new', icon: HandCoins, permission: 'create_requests', notificationKey: null },
  { name: 'Request Overtime', href: '/dashboard/requests/overtime/new', icon: Clock, permission: 'create_requests', notificationKey: null },
  { name: 'File Complaint', href: '/dashboard/requests/complaint/new', icon: MessageSquareWarning, permission: 'create_requests', notificationKey: null },
  { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign, permission: 'access_payroll_section', notificationKey: null },
  { key: 'commissions_direct', name: 'Commissions', href: '/dashboard/commissions', icon: Coins, permission: 'manage_commissions', notificationKey: null },
];

interface SidebarProps {
    userPermissions: string[];
    notificationCounts: { [key: string]: number };
}

export default function Sidebar({ userPermissions, notificationCounts }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [localNotifCounts, setLocalNotifCounts] = useState(notificationCounts);

 // Helper function to process the raw notification list from the API
  const processNotifications = (notifications: any[]): { [key: string]: number } => {
    const counts: { [key: string]: number } = {};
    notifications.forEach((notif: any) => {
        if (notif.link_url === '/dashboard/requests/review') {
            counts['review_requests'] = (counts['review_requests'] || 0) + 1;
        } else if (notif.link_url === '/dashboard/my-requests') {
            counts['my_requests'] = (counts['my_requests'] || 0) + 1;
        }
    });
    return counts;
  };

  // The polling function that runs periodically
  const fetchNotifications = useCallback(async () => {
    try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const { notifications } = await res.json();
        setLocalNotifCounts(processNotifications(notifications));
    } catch (error) {
        console.error("Polling for notifications failed:", error);
    }
  }, []);

  // useEffect to set up the polling interval
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds
    // Cleanup function to stop the interval when the component unmounts
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const availableLinks = ALL_NAV_LINKS.filter(link => {
    if (link.permission === null) return true;
    if (!userPermissions.includes(link.permission)) return false;
    if (link.key === 'commissions_direct' && userPermissions.includes('access_payroll_section')) return false;
    return true;
  });

  const handleLinkClick = async (notificationKey: string | null) => {
    if (notificationKey && localNotifCounts[notificationKey] > 0) {
      setLocalNotifCounts(prevCounts => ({ ...prevCounts, [notificationKey]: 0 }));
      try {
        await fetch('/api/notifications/mark-as-read', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: notificationKey }),
        });
        router.refresh();
      } catch (error) { console.error("Failed to mark notifications as read:", error); }
    }
  };

  return (
    <div className={`relative bg-blue-900 text-white transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-blue-800 p-1 rounded-full text-white z-10"><ChevronRight className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} /></button>
      <div className="flex flex-col h-full">
        <div className="p-4 flex-shrink-0"><h2 className={`font-bold text-xl transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Menu</h2></div>
        <nav className="flex-grow overflow-y-auto scrollbar-thin">
          {availableLinks.map(link => {
                        const isActive = pathname === link.href;

            const notifCount = link.notificationKey ? localNotifCounts[link.notificationKey] || 0 : 0;
            return (
              <Link key={link.key || link.name} href={link.href} onClick={() => handleLinkClick(link.notificationKey)} className={`relative flex items-center p-4 text-sm font-medium transition-colors ${isActive ? 'bg-blue-700' : 'text-blue-100 hover:bg-blue-800'}`}>
                <link.icon className="h-6 w-6" />
                {isExpanded && <span className="ml-4">{link.name}</span>}
                {isExpanded && notifCount > 0 && (<span className="absolute right-4 top-1/2 -translate-y-1/2 h-5 min-w-[1.25rem] px-1 bg-red-500 rounded-full flex items-center justify-center text-xs">{notifCount}</span>)}
                {!isExpanded && notifCount > 0 && (<span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-blue-900"></span>)}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 flex-shrink-0 border-t border-blue-800">
            <button onClick={logout} className="flex items-center w-full p-2 text-sm font-medium rounded-md text-red-300 hover:bg-red-700 hover:text-white">
              <LogOut className={`h-6 w-6 ${isExpanded ? '' : 'mx-auto'}`} />
              {isExpanded && <span className="ml-4">Logout</span>}
            </button>
        </div>
      </div>
    </div>
  );
}