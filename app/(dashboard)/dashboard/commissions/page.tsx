// app/dashboard/commissions/page.tsx
import CommissionCalculator from "@/components/dashboard/CommissionCalculator";
import db from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

async function getStaffList() {
    const [staff] = await db.query<RowDataPacket[]>('SELECT id, full_name FROM staff ORDER BY full_name');
    interface StaffOption extends RowDataPacket { id: number; full_name: string; }
    return staff as StaffOption[];
}

export default async function CommissionsPage() {
    const staffList = await getStaffList();

    return (
        <>
            <div className="mb-8">
                 <Link 
            href="/dashboard/payroll" 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll Management
        </Link>
                <h1 className="text-3xl font-bold text-gray-800">Commissions Calculator</h1>
                <p className="text-gray-600">Calculate and save commission records for staff.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
                <CommissionCalculator staffList={staffList} />
            </div>
        </>
    );
}