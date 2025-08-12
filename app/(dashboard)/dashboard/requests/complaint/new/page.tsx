// app/dashboard/requests/complaint/new/page.tsx
import ComplaintForm from "@/components/dashboard/ComplaintForm";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

// Fetch the current user's details to pre-fill the form
async function getCurrentUser(userId: number) {
    const [results] = await db.query<RowDataPacket[]>('SELECT full_name, department, primary_phone_number FROM staff WHERE id = ?', [userId]);
    return results[0] || null;
}

export default async function NewComplaintPage() {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    
    const user = await getCurrentUser(session.userId);

    return (
        <>
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Employee Complaint Form</h1>
                <p className="text-gray-600">Please provide all details regarding your complaint.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
                <ComplaintForm user={user} />
            </div>
        </>
    );
}