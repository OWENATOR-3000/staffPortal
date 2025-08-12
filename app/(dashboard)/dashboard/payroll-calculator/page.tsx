// app/dashboard/payroll/page.tsx
import PayrollCalculator from "@/components/dashboard/PayrollCalculator";
import db from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { RowDataPacket } from "mysql2";
import Link from "next/link";

// Define the StaffMember type here so it can be used in this file
interface StaffMember extends RowDataPacket {
  id: number;
  full_name: string;
  hourly_rate: number;
}

// Server-side function to fetch all staff for the dropdown
async function getStaffList(): Promise<StaffMember[]> { // Also good practice to type the function's return value
  const [staff] = await db.query<RowDataPacket[]>(
    'SELECT id, full_name, hourly_rate FROM staff ORDER BY full_name'
  );
  
  // THE FIX IS HERE: We assert the type of the result.
  return staff as StaffMember[];
}

export default async function PayrollPage() {
  const staffList = await getStaffList();

  return (
    <>
      <div className="mb-8">
         {/* --- 3. ADD THE BACK BUTTON LINK HERE --- */}
        <Link 
            href="/dashboard/payroll" 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll Management
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Payroll Calculator</h1>
        <p className="text-gray-600">Calculate staff pay based on hours worked.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Now, the staffList prop matches the expected type */}
        <PayrollCalculator staffList={staffList.map(s => ({ ...s, hourly_rate: String(s.hourly_rate) }))} />
      </div>
    </>
  );
}