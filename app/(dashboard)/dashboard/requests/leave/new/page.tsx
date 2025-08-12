// app/dashboard/requests/leave/new/page.tsx
import LeaveRequestForm from "@/components/dashboard/LeaveRequestForm";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

// Fetch the current user's name for pre-filling the form
async function getCurrentUserName(userId: number) {
    const [results] = await db.query<RowDataPacket[]>('SELECT full_name FROM staff WHERE id = ?', [userId]);
    return results[0]?.full_name || 'N/A';
}

export default async function NewLeaveRequestPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    
    const employeeName = await getCurrentUserName(session.userId);

    return (
        <>
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Employee Leave Request Form</h1>
                <p className="text-gray-600">Complete the form below to request time off.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
                <LeaveRequestForm employeeName={employeeName} />
            </div>
        </>
    );
}