// app/dashboard/requests/review/page.tsx
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import ReviewRequestsList from "@/components/dashboard/ReviewRequestsList";

// Update the interface to include all possible request types and fields
export interface RequestWithDetails extends RowDataPacket {
  id: number;
  staff_id: number;
  staff_name: string;
  requestable_type: 'Leave' | 'Salary Advance' | 'Overtime' | 'Complaint'| 'Loan';
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  // Details for all types (optional)

  start_date?: Date;
  end_date?: Date;
  reason_type?: string;
  amount_requested?: string;
  reason?: string;
  overtime_date?: Date;
  hours_worked?: string;
  complaint_nature?: string; // New
  loan_type?: string;
}

export interface StaffOption extends RowDataPacket {
  id: number;
  full_name: string;
}

// Update the main data fetching function
// This function goes inside your app/dashboard/requests/review/page.tsx file

async function getAllRequests(): Promise<RequestWithDetails[]> {
  const query = `
    SELECT 
      req.id, 
      req.staff_id, 
      req.requestable_type, 
      req.status, 
      req.created_at,
      s.full_name as staff_name,
      -- Leave Details
      lr.start_date, 
      lr.end_date, 
      lr.reason_type,
      -- Salary Advance Details
      sar.amount_requested, 
      sar.reason,
      -- Overtime Details
      otr.overtime_date, 
      otr.hours_worked,
      -- Complaint Details
      c.complaint_nature,
      -- Loan Details
      ln.loan_type
    FROM requests req
    JOIN staff s ON req.staff_id = s.id
    LEFT JOIN leave_requests lr ON req.requestable_id = lr.id AND req.requestable_type = 'Leave'
    LEFT JOIN salary_advance_requests sar ON req.requestable_id = sar.id AND req.requestable_type = 'Salary Advance'
    LEFT JOIN overtime_requests otr ON req.requestable_id = otr.id AND req.requestable_type = 'Overtime'
    LEFT JOIN complaints c ON req.requestable_id = c.id AND req.requestable_type = 'Complaint'
    LEFT JOIN loan_requests ln ON req.requestable_id = ln.id AND req.requestable_type = 'Loan'
    ORDER BY 
      CASE req.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
      END,
      req.created_at DESC;
  `;
  const [results] = await db.query<RowDataPacket[]>(query);
  return results as RequestWithDetails[];
}
async function getStaffForFilter(): Promise<StaffOption[]> {
  const [results] = await db.query<RowDataPacket[]>('SELECT id, full_name FROM staff ORDER BY full_name');
  return results as StaffOption[];
}

export default async function ReviewRequestsPage() {
  const session = getSessionUser();
  if (!session) redirect('/login');
  
  const [requests, staffList] = await Promise.all([
    getAllRequests(),
    getStaffForFilter()
  ]);
  
  // Add 'Complaint' to the list of filterable types
  const requestTypes = ['Leave', 'Salary Advance', 'Overtime', 'Complaint', 'Loan'];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Review Staff Requests</h1>
        <p className="text-gray-600">Approve, deny, or review pending requests from all employees.</p>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <ReviewRequestsList
          initialRequests={requests}
          staffList={staffList}
          requestTypes={requestTypes}
        />
      </div>
    </>
  );
}