// components/dashboard/RequestPreviewModal.tsx
"use client";

import { X } from 'lucide-react';
import React from 'react'; // Import React for React.ReactNode

// --- Type Definitions for the Request Data ---
// These should ideally be in a shared types file (e.g., types/requests.ts)
// so they can be used by both the API and the frontend components.

interface LeaveDetails {
    supervisor_name: string;
    reason_type: string;
    reason_details?: string;
    start_date: string;
    end_date: string;
    number_of_hours: number;
    comments: string;
}

interface SalaryAdvanceDetails {
    amount_requested: string;
    requested_repayment_date: string;
    reason: string;
}

interface OvertimeDetails {
    overtime_date: string;
    hours_worked: string;
    reason: string;
}

interface ComplaintDetails {
    incident_date: string;
    incident_time: string;
    location: string;
    complaint_nature: 'Other' | string;
    complaint_nature_other?: string;
    description: string;
    desired_resolution: string;
}

interface LoanDetails {
    loan_type: string;
    amount_requested: string;
    reason: string;
    proposed_repayment_terms: string;
    employee_signature_name: string;
}

// Discriminated union for the request details
type RequestDetails = 
    | { requestable_type: 'Leave', details: LeaveDetails }
    | { requestable_type: 'Salary Advance', details: SalaryAdvanceDetails }
    | { requestable_type: 'Overtime', details: OvertimeDetails }
    | { requestable_type: 'Complaint', details: ComplaintDetails }
    | { requestable_type: 'Loan', details: LoanDetails };

// The main Request object type
type FullRequest = {
    id: number;
    staff_name: string;
    staff_email: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_by?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    reviewer_name?: string;
} & RequestDetails;

// A helper component for displaying a row of data
// FIX 1: 'value' is now typed as React.ReactNode to allow strings, numbers, or JSX elements
const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
    </div>
);

// Main Modal Component
// FIX 2: Use our new FullRequest type for the 'request' prop
export default function RequestPreviewModal({ request, onClose }: { request: FullRequest | null, onClose: () => void }) {
    if (!request) return null;

    // --- RENDER FUNCTIONS FOR EACH TYPE ---
    // Each function now expects a specific, strongly-typed details object
    const renderLeaveDetails = (details: LeaveDetails) => (
        <>
            <DetailRow label="Supervisor" value={details.supervisor_name} />
            <DetailRow label="Reason Type" value={details.reason_type} />
            {details.reason_details && <DetailRow label="Details" value={details.reason_details} />}
            <DetailRow label="Start Date" value={new Date(details.start_date).toLocaleDateString()} />
            <DetailRow label="End Date" value={new Date(details.end_date).toLocaleDateString()} />
            <DetailRow label="Number of Hours" value={details.number_of_hours} />
            <DetailRow label="Comments" value={details.comments} />
        </>
    );

    const renderSalaryAdvanceDetails = (details: SalaryAdvanceDetails) => (
        <>
            <DetailRow label="Amount Requested" value={`N$ ${parseFloat(details.amount_requested).toFixed(2)}`} />
            <DetailRow label="Requested Payout Date" value={new Date(details.requested_repayment_date).toLocaleDateString()} />
            <DetailRow label="Reason" value={<p className="whitespace-pre-wrap">{details.reason}</p>} />
        </>
    );
    
    const renderOvertimeDetails = (details: OvertimeDetails) => (
        <>
            <DetailRow label="Date of Overtime" value={new Date(details.overtime_date).toLocaleDateString()} />
            <DetailRow label="Hours Worked" value={`${parseFloat(details.hours_worked).toFixed(2)} hours`} />
            <DetailRow label="Reason" value={<p className="whitespace-pre-wrap">{details.reason}</p>} />
        </>
    );

    const renderComplaintDetails = (details: ComplaintDetails) => (
        <>
            <DetailRow label="Date of Incident" value={new Date(details.incident_date).toLocaleDateString()} />
            <DetailRow label="Time of Incident" value={details.incident_time} />
            <DetailRow label="Location" value={details.location} />
            <DetailRow label="Nature of Complaint" value={details.complaint_nature} />
            {details.complaint_nature === 'Other' && (
                 <DetailRow label="Other Details" value={details.complaint_nature_other} />
            )}
            <DetailRow label="Description" value={<p className="whitespace-pre-wrap">{details.description}</p>} />
            <DetailRow label="Desired Resolution" value={<p className="whitespace-pre-wrap">{details.desired_resolution}</p>} />
        </>
    );
    
    const renderLoanDetails = (details: LoanDetails) => (
        <>
            <DetailRow label="Loan Type" value={details.loan_type} />
            <DetailRow label="Amount Requested" value={`N$ ${parseFloat(details.amount_requested).toFixed(2)}`} />
            <DetailRow label="Reason" value={<p className="whitespace-pre-wrap">{details.reason}</p>} />
            <DetailRow label="Proposed Repayment" value={<p className="whitespace-pre-wrap">{details.proposed_repayment_terms}</p>} />
            <DetailRow label="Signature" value={details.employee_signature_name} />
        </>
    );

    // This function acts as a router to call the correct rendering function
    const renderRequestSpecificDetails = () => {
        switch (request.requestable_type) {
            case 'Leave': return renderLeaveDetails(request.details);
            case 'Salary Advance': return renderSalaryAdvanceDetails(request.details);
            case 'Overtime': return renderOvertimeDetails(request.details);
            case 'Complaint': return renderComplaintDetails(request.details);
            case 'Loan': return renderLoanDetails(request.details);
            default: return null;
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Request Details - #{request.id}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <dl className="divide-y divide-gray-200">
                        {/* Common Details */}
                        <DetailRow label="Employee" value={request.staff_name} />
                        <DetailRow label="Email" value={request.staff_email} />
                        <DetailRow label="Request Type" value={request.requestable_type} />
                        <DetailRow label="Status" value={request.status} />
                        <DetailRow label="Submitted At" value={new Date(request.created_at).toLocaleString()} />
                        
                        {/* Render the specific details using our router function */}
                        {renderRequestSpecificDetails()}
                        
                        {/* Reviewer Details */}
                        {request.status !== 'pending' && (
                             <div className="pt-4 border-t mt-4">
                                <DetailRow label="Reviewed By" value={request.reviewer_name} />
                                <DetailRow label="Reviewed At" value={new Date(request.reviewed_at!).toLocaleString()} />
                                {request.status === 'rejected' && (<DetailRow label="Denial Reason" value={request.rejection_reason} />)}
                            </div>
                        )}
                    </dl>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Close</button>
                </div>
            </div>
        </div>
    );
}