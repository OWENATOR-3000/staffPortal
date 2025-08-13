// app/dashboard/staff/edit/[id]/page.tsx

import EditStaffForm from "@/components/dashboard/EditStaffForm";
import db from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

// --- 1. DEFINE THE TYPES (These were already perfect) ---
interface Staff extends RowDataPacket {
    id: number;
    title: string | null;
    first_name: string | null;
    last_name: string | null;
    primary_phone_number: string | null;
    secondary_phone_number: string | null;
    emergency_phone_number: string | null;
    postal_address: string | null;
    social_security_code: string | null;
    id_number: string | null;
    email: string;
    job_title: string | null;
    department: string | null;
    role_id: number | null;
    profile_image_url: string | null;
    start_date: string | null;
    employee_number: string | null;
    monthly_salary: number | string | null;
}

interface Role extends RowDataPacket {
    id: number;
    name: string;
}

// Define the props for the page component for better readability
interface EditStaffPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: EditStaffPageProps): Promise<Metadata> {
  // You can now use params.id to fetch data for the title, etc.
  const staff = await getStaffDetails(params.id); // Assuming getStaffDetails exists

  const title = staff ? `Edit ${staff.first_name} ${staff.last_name}` : 'Staff Not Found';

  return {
    title: title,
    description: `Edit the profile for staff member ID ${params.id}`,
  };
}

// --- 2. DATA FETCHING FUNCTIONS (These were already perfect) ---
async function getStaffDetails(staffId: string): Promise<Staff | null> {
    const [staff] = await db.query<RowDataPacket[]>(
        `SELECT 
            s.id, s.title, s.first_name, s.last_name, s.email, s.job_title, s.department,
            s.primary_phone_number, s.secondary_phone_number, s.emergency_phone_number,
            s.postal_address, s.social_security_code, s.id_number, s.profile_image_url,
            sr.role_id,
            s.start_date, s.employee_number,
            s.monthly_salary 
         FROM staff s 
         LEFT JOIN staff_role sr ON s.id = sr.staff_id 
         WHERE s.id = ?`,
        [staffId]
    );
    return (staff[0] as Staff) || null;
}

async function getRoles(): Promise<Role[]> {
    const [roles] = await db.query<RowDataPacket[]>('SELECT id, name FROM roles');
    return roles as Role[];
}


// --- MAIN PAGE COMPONENT (FIXED) ---
export default async function EditStaffPage({ params }: EditStaffPageProps) {
    // await params; // <-- THIS LINE WAS REMOVED. It was causing the build error.

    const session = await getSessionUser();
    if (!session) redirect('/login');

    // Fetch data concurrently for better performance
    const [staffDetails, roles] = await Promise.all([
        getStaffDetails(params.id),
        getRoles()
    ]);

    if (!staffDetails) {
        return <div className="p-8 text-center text-gray-500">Staff member not found.</div>;
    }

    const fullName = `${staffDetails.first_name || ''} ${staffDetails.last_name || ''}`.trim();

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard/staff" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Staff Management
            </Link>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Edit Employee Profile</h1>
                <p className="text-gray-600">Update the details for {fullName}.</p>
            </div>
            
            {/* The EditStaffForm now receives all the correct data */}
            <EditStaffForm staff={staffDetails} roles={roles} />
        </div>
    );
}