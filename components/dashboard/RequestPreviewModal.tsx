// components/dashboard/RequestPreviewModal.tsx
"use client";

import { X } from 'lucide-react';

// A helper component for displaying a row of data
const DetailRow = ({ label, value }: { label: string, value: any }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || 'N/A'}</dd>
    </div>
);

export default function RequestPreviewModal({ request, onClose }: { request: any, onClose: () => void }) {
    if (!request) return null;

    // --- RENDER FUNCTIONS FOR EACH TYPE ---
    const renderLeaveDetails = (details: any) => (
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

    const renderSalaryAdvanceDetails = (details: any) => (
        <>
            <DetailRow label="Amount Requested" value={`N$ ${parseFloat(details.amount_requested).toFixed(2)}`} />
            <DetailRow label="Requested Payout Date" value={new Date(details.requested_repayment_date).toLocaleDateString()} />
            <DetailRow label="Reason" value={<p className="whitespace-pre-wrap">{details.reason}</p>} />
        </>
    );
    
    const renderOvertimeDetails = (details: any) => (
        <>
            <DetailRow label="Date of Overtime" value={new Date(details.overtime_date).toLocaleDateString()} />
            <DetailRow label="Hours Worked" value={`${parseFloat(details.hours_worked).toFixed(2)} hours`} />
            <DetailRow label="Reason" value={<p className="whitespace-pre-wrap">{details.reason}</p>} />
        </>
    );

    const renderComplaintDetails = (details: any) => (
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

    // --- THIS IS THE NEW FUNCTION YOU ARE ADDING ---
    const renderLoanDetails = (details: any) => (
        <>
            <DetailRow label="Loan Type" value={details.loan_type} />
            <DetailRow label="Amount Requested" value={`N$ ${parseFloat(details.amount_requested).toFixed(2)}`} />
            <DetailRow label="Reason" value={<p className="whitespace-pre-wrap">{details.reason}</p>} />
            <DetailRow label="Proposed Repayment" value={<p className="whitespace-pre-wrap">{details.proposed_repayment_terms}</p>} />
            <DetailRow label="Signature" value={details.employee_signature_name} />
        </>
    );


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
                        
                        {/* --- THIS IS THE UPDATED CONDITIONAL RENDERING LOGIC --- */}
                        {request.requestable_type === 'Leave' && renderLeaveDetails(request.details)}
                        {request.requestable_type === 'Salary Advance' && renderSalaryAdvanceDetails(request.details)}
                        {request.requestable_type === 'Overtime' && renderOvertimeDetails(request.details)}
                        {request.requestable_type === 'Complaint' && renderComplaintDetails(request.details)}
                        {request.requestable_type === 'Loan' && renderLoanDetails(request.details)}
                        
                        {/* Reviewer Details */}
                        {request.status !== 'pending' && (
                             <div className="pt-4 border-t mt-4">
                                <DetailRow label="Reviewed By" value={request.reviewer_name} />
                                <DetailRow label="Reviewed At" value={new Date(request.reviewed_at).toLocaleString()} />
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