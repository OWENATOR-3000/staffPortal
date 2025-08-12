// app/dashboard/payroll/payslips/page.tsx
import PayslipGenerator from "@/components/dashboard/PayslipGenerator";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Server-side function to get the list of staff
async function getStaffList() {
    const [staff] = await db.query<RowDataPacket[]>('SELECT id, full_name FROM staff ORDER BY full_name');
    return staff as { id: number; full_name: string }[];
}

export default async function GeneratePayslipPage() {
    const session = getSessionUser();
    if (!session) redirect('/login');

    const staffList = await getStaffList();

    return (
        <>
            <div className="mb-8">
                <Link href="/dashboard/payroll" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Payroll Management
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Generate Payslip</h1>
                <p className="text-gray-600">Select an employee and pay period to generate a payslip.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <PayslipGenerator staffList={staffList} />
            </div>
        </>
    );
}