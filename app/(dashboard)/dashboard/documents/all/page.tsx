// app/dashboard/documents/all/page.tsx

import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import AllDocumentsList from "@/components/dashboard/AllDocumentsList"; // We will create this

// Type for the full document list with user info
export interface DocumentWithUser extends RowDataPacket {
  id: number;
  file_name: string;
  file_size: number;
  uploaded_at: Date;
  category: string;
  staff_id: number;
  staff_name: string;
}

// Type for the staff dropdown
export interface StaffOption extends RowDataPacket {
  id: number;
  full_name: string;
}

// Server-side function to fetch all documents and staff
async function getCompanyDocuments(): Promise<DocumentWithUser[]> {
  const query = `
    SELECT 
      d.id, d.file_name, d.file_size, d.uploaded_at, d.category,
      s.id as staff_id, s.full_name as staff_name
    FROM documents d
    JOIN staff s ON d.staff_id = s.id
    ORDER BY d.uploaded_at DESC;
  `;
  const [results] = await db.query<RowDataPacket[]>(query);
  return results as DocumentWithUser[];
}

async function getStaffForFilter(): Promise<StaffOption[]> {
    const [results] = await db.query<RowDataPacket[]>('SELECT id, full_name FROM staff ORDER BY full_name');
    return results as StaffOption[];
}


export default async function AllDocumentsPage() {
  const session = getSessionUser();
  if (!session) redirect('/login');

  // Add a server-side permission check for security
  // const hasPermission = await userHasPermission(session.userId, 'view_all_documents');
  // if (!hasPermission) redirect('/dashboard');

  const [documents, staffList] = await Promise.all([
    getCompanyDocuments(),
    getStaffForFilter()
  ]);
  
  const categories = ['CV / Resume', 'ID / Passport', 'Contract', 'Certificate', 'Report', 'Other'];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Company Documents</h1>
        <p className="text-gray-600">View and filter all documents uploaded by staff.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* We pass all data to a Client Component to handle interactive filtering */}
        <AllDocumentsList
            initialDocuments={documents}
            staffList={staffList}
            categories={categories}
        />
      </div>
    </>
  );
}