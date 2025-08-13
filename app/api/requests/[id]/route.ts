// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2/promise'; // Use from 'mysql2/promise'

// --- Type Definitions for a Fully Typed Request ---

interface LeaveDetails extends RowDataPacket {
    start_date: string;
    end_date: string;
    reason_type: string;
    reason_details?: string;
    number_of_hours: number;
    supervisor_name: string;
    employee_signature_name: string;
    comments: string;
    document_id?: number;
}

interface SalaryAdvanceDetails extends RowDataPacket {
    amount_requested: number;
    requested_repayment_date: string;
    reason: string;
    supervisor_signature_date?: string;
    supervisor_name?: string; // Added for consistency
}

interface OvertimeDetails extends RowDataPacket {
    overtime_date: string;
    overtime_type: "Normal" | "Sunday";
    hours_worked: number;
    reason: string;
}

interface ComplaintDetails extends RowDataPacket {
    incident_date: string;
    incident_time: string;
    location: string;
    complaint_nature: "Harassment" | "Unfair Treatment" | "Workplace Safety" | "Other";
    complaint_nature_other?: string;
    description: string;
    desired_resolution: string;
    acknowledgment: number;
}

interface LoanDetails extends RowDataPacket {
    amount_requested: number;
    loan_type: string;
    proposed_repayment_terms: string;
    reason: string;
    employee_signature_name: string;
}

// This is the discriminated union.
type RequestDetails = 
    | { requestable_type: 'Leave', details: LeaveDetails }
    | { requestable_type: 'Salary Advance', details: SalaryAdvanceDetails }
    | { requestable_type: 'Overtime', details: OvertimeDetails }
    | { requestable_type: 'Complaint', details: ComplaintDetails }
    | { requestable_type: 'Loan', details: LoanDetails };
    
// The new, fully-typed FullRequest.
type FullRequest = RowDataPacket & {
    id: number;
    staff_name: string;
    staff_email: string;
    reviewer_name: string | null;
} & RequestDetails;


// THIS IS THE CORRECTED, FULLY TYPE-SAFE HELPER FUNCTION
async function getFullRequestDetails(requestId: string): Promise<FullRequest | null> {
    const [requestData] = await db.query<RowDataPacket[]>(
        `SELECT 
            req.*, 
            s.full_name as staff_name, 
            s.email as staff_email,
            r.full_name as reviewer_name 
         FROM requests req
         JOIN staff s ON req.staff_id = s.id
         LEFT JOIN staff r ON req.reviewed_by = r.id
         WHERE req.id = ?`,
        [requestId]
    );

    const baseRequest = requestData[0];
    if (!baseRequest) {
        return null;
    }

    // Now we fetch details and add them to the EXISTING baseRequest object.
    if (baseRequest.requestable_type === 'Leave') {
        const [details] = await db.query<LeaveDetails[]>('SELECT * FROM leave_requests WHERE id = ?', [baseRequest.requestable_id]);
        if (details[0]) {
            // This is the fix: Augment the original object instead of creating a new one.
            return { ...baseRequest, details: details[0] } as FullRequest;
        }
    } 
    else if (baseRequest.requestable_type === 'Salary Advance') {
        const [details] = await db.query<SalaryAdvanceDetails[]>('SELECT * FROM salary_advance_requests WHERE id = ?', [baseRequest.requestable_id]);
        if (details[0]) {
            return { ...baseRequest, details: details[0] } as FullRequest;
        }
    }
    else if (baseRequest.requestable_type === 'Overtime') {
        const [details] = await db.query<OvertimeDetails[]>('SELECT * FROM overtime_requests WHERE id = ?', [baseRequest.requestable_id]);
        if (details[0]) {
            return { ...baseRequest, details: details[0] } as FullRequest;
        }
    }
    else if (baseRequest.requestable_type === 'Complaint') {
        const [details] = await db.query<ComplaintDetails[]>('SELECT * FROM complaints WHERE id = ?', [baseRequest.requestable_id]);
        if (details[0]) {
            return { ...baseRequest, details: details[0] } as FullRequest;
        }
    }
    else if (baseRequest.requestable_type === 'Loan') {
        const [details] = await db.query<LoanDetails[]>('SELECT * FROM loan_requests WHERE id = ?', [baseRequest.requestable_id]);
        if (details[0]) {
            return { ...baseRequest, details: details[0] } as FullRequest;
        }
    }

    // Return null if details are not found for a valid request type
    return null;
}

// MAIN GET HANDLER (Now with improved type checking)
export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(); // Corrected: must await the promise
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const requestData = await getFullRequestDetails(params.id);
    
    // This check is now simpler and fully type-safe
    if (!requestData) {
        return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json(requestData);

  } catch (error) {
    // No ': any' needed here
    console.error("Fetch request details error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}