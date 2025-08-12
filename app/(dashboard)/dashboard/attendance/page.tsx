// app/dashboard/attendance/page.tsx
import AttendanceLogViewer from "@/components/dashboard/AttendanceLogViewer";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

// 1. DEFINE THE StaffOption TYPE HERE
// This makes it available for both the function and the component prop.
interface StaffOption extends RowDataPacket {
  id: number;
  full_name: string;
}

// Server-side function to get the list of staff for the filter dropdown
async function getStaffList(): Promise<StaffOption[]> { // Explicitly type the return value
    const [staff] = await db.query<RowDataPacket[]>(
        'SELECT id, full_name FROM staff ORDER BY full_name'
    );
    
    // 2. THE FIX: Assert the type of the returned data.
    return staff as StaffOption[];
}

export default async function AttendanceLogPage() {
    // We'll fetch the staff list on the server to pass to the client component
    const staffList = await getStaffList();

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Global Attendance Log</h1>
                <p className="text-gray-600">View and filter clock-in/out records for all employees.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                {/* Now the 'staffList' prop perfectly matches the expected type */}
                <AttendanceLogViewer staffList={staffList} />
            </div>
        </>
    );
}