// app/dashboard/requests/salary-advance/new/page.tsx
import SalaryAdvanceForm from "@/components/dashboard/SalaryAdvanceForm";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

async function getCurrentUserName(userId: number) {
    const [results] = await db.query<RowDataPacket[]>('SELECT full_name FROM staff WHERE id = ?', [userId]);
    return results[0]?.full_name || 'N/A';
}

export default async function NewSalaryAdvancePage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    
    const employeeName = await getCurrentUserName(session.userId);

    return (
        <>
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Request for Advance on Salary</h1>
                <p className="text-gray-600">Complete the form below to request an advance payment.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md">
                <SalaryAdvanceForm employeeName={employeeName} />
            </div>
        </>
    );
}