// app/dashboard/staff/page.tsx

import db from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import Image from 'next/image';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";

// --- TYPE DEFINITIONS ---
interface StaffMember extends RowDataPacket {
  id: number;
  full_name: string;
  job_title: string;
  email: string;
  role_name: string;
  profile_image_url: string | null;
}

interface PageProps {
  searchParams: {
    search?: string;
    role?: string;
    jobTitle?: string;
  };
}

// --- DATABASE FETCHING FUNCTIONS ---

// Fetches the filtered list of staff members
async function getStaffList({ search, role, jobTitle }: PageProps["searchParams"]): Promise<StaffMember[]> {
  let query = `
    SELECT 
      s.id, s.full_name, s.job_title, s.email, s.profile_image_url, r.name as role_name
    FROM staff s
    LEFT JOIN staff_role sr ON s.id = sr.staff_id
    LEFT JOIN roles r ON sr.role_id = r.id
    WHERE 1 = 1
  `;
  const values: (string | number)[] = [];

  if (search) {
    query += ` AND (s.full_name LIKE ? OR s.email LIKE ?)`;
    values.push(`%${search}%`, `%${search}%`);
  }

  if (role) {
    query += ` AND r.name = ?`;
    values.push(role);
  }

  if (jobTitle) {
    query += ` AND s.job_title = ?`;
    values.push(jobTitle);
  }

  query += ` ORDER BY s.full_name`;

  const [results] = await db.query<RowDataPacket[]>(query, values);
  return results as StaffMember[];
}

// NEW: Fetches all unique roles from the database for the filter dropdown
async function getRoles(): Promise<{ name: string }[]> {
  const [results] = await db.query<RowDataPacket[]>("SELECT name FROM roles ORDER BY name ASC");
  return results as { name: string }[];
}

// NEW: Fetches all unique job titles from the database for the filter dropdown
async function getJobTitles(): Promise<{ job_title: string }[]> {
  const query = "SELECT DISTINCT job_title FROM staff WHERE job_title IS NOT NULL AND job_title != '' ORDER BY job_title ASC";
  const [results] = await db.query<RowDataPacket[]>(query);
  return results as { job_title: string }[];
}


// --- PAGE COMPONENT ---

export default async function ManageStaffPage({ searchParams }: PageProps) {
  const session = await getSessionUser();
  if (!session) redirect('/login');
  
  // Use Promise.all to fetch all data concurrently for better performance
  const [staffList, roles, jobTitles] = await Promise.all([
    getStaffList(searchParams),
    getRoles(),
    getJobTitles(),
  ]);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Staff</h1>
          <p className="text-gray-600">Add, view, and edit staff profiles.</p>
        </div>
        <Link href="/dashboard/staff/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Employee
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <form className="flex flex-wrap items-end gap-4 p-4 bg-white border-b border-gray-200">
            {/* Search Input */}
            <div className="flex flex-col">
              <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                id="search"
                name="search"
                placeholder="Name or Email"
                className="w-60 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                defaultValue={searchParams.search || ''}
              />
            </div>

            {/* Role Dropdown (Now Dynamic) */}
            <div className="flex flex-col">
              <label htmlFor="role" className="text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                id="role"
                name="role"
                defaultValue={searchParams.role || ''}
                className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title Dropdown (Now Dynamic) */}
            <div className="flex flex-col">
              <label htmlFor="jobTitle" className="text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <select
                id="jobTitle"
                name="jobTitle"
                defaultValue={searchParams.jobTitle || ''}
                className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              >
                <option value="">All Job Titles</option>
                {jobTitles.map((job) => (
                  <option key={job.job_title} value={job.job_title}>
                    {job.job_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <div className="pt-5">
              <button
                type="submit"
                className="inline-flex items-center px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Filter
              </button>
            </div>
          </form>

          {/* Staff Table */}
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Job Title</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length > 0 ? (
                staffList.map((staff) => (
                  <tr key={staff.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center">
                        <Image 
                          src={staff.profile_image_url || '/defaulticon.png'}
                          alt={`${staff.full_name}'s profile picture`}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover mr-4"
                        />
                        <div>
                          <div className="font-bold">{staff.full_name}</div>
                          <div className="text-xs text-gray-500">{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{staff.job_title || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${
                        staff.role_name === 'Admin' ? 'text-purple-700 bg-purple-100' :
                        staff.role_name === 'HR Manager' ? 'text-red-700 bg-red-100' :
                        'text-green-700 bg-green-100'
                      }`}>
                        {staff.role_name || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-4">
                        <Link href={`/dashboard/staff/edit/${staff.id}`} className="font-medium text-blue-600 hover:underline">
                          Edit
                        </Link>
                        <DeleteConfirmationModal staffId={staff.id} fullName={staff.full_name} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white border-b">
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No staff members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}