// components/dashboard/ReviewRequestsList.tsx
"use client";

import { useState, useMemo } from 'react';
import { RequestWithDetails, StaffOption } from '@/app/(dashboard)/dashboard/requests/review/page';
import { Download, Eye, X, Check } from 'lucide-react';
import RequestPreviewModal from './RequestPreviewModal';

// --- SHARED TYPE DEFINITIONS ---
// Ideally, these would be in a shared file like 'types/requests.ts' and imported.
interface LeaveDetails { supervisor_name: string; reason_type: string; reason_details?: string; start_date: string; end_date: string; number_of_hours: number; comments: string; }
interface SalaryAdvanceDetails { amount_requested: string; requested_repayment_date: string; reason: string; }
interface OvertimeDetails { overtime_date: string; hours_worked: string; reason: string; }
interface ComplaintDetails { incident_date: string; incident_time: string; location: string; complaint_nature: 'Other' | string; complaint_nature_other?: string; description: string; desired_resolution: string; }
interface LoanDetails { loan_type: string; amount_requested: string; reason: string; proposed_repayment_terms: string; employee_signature_name: string; }

type RequestDetailsUnion = 
    | { requestable_type: 'Leave', details: LeaveDetails }
    | { requestable_type: 'Salary Advance', details: SalaryAdvanceDetails }
    | { requestable_type: 'Overtime', details: OvertimeDetails }
    | { requestable_type: 'Complaint', details: ComplaintDetails }
    | { requestable_type: 'Loan', details: LoanDetails };
    
type FullRequestForModal = {
    id: number; staff_name: string; staff_email: string; status: 'pending' | 'approved' | 'rejected';
    created_at: string; reviewed_by?: string; reviewed_at?: string; rejection_reason?: string; reviewer_name?: string;
} & RequestDetailsUnion;

// --- COMPONENT PROPS & STYLES ---
interface Props {
  initialRequests: RequestWithDetails[];
  staffList: StaffOption[];
  requestTypes: string[];
  initialFilterType?: string;
}

const statusStyles: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function ReviewRequestsList({ initialRequests, staffList, requestTypes, initialFilterType }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedType, setSelectedType] = useState(initialFilterType || 'all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  // FIX: Use our new, specific type for the selected request state.
  const [selectedRequest, setSelectedRequest] = useState<FullRequestForModal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const staffMatch = selectedStaff === 'all' || req.staff_id.toString() === selectedStaff;
      const typeMatch = selectedType === 'all' || req.requestable_type === selectedType;
      const statusMatch = selectedStatus === 'all' || req.status === selectedStatus;
      return staffMatch && typeMatch && statusMatch;
    });
  }, [requests, selectedStaff, selectedType, selectedStatus]);

  const handlePreview = async (requestId: number) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`);
      if (!res.ok) throw new Error('Failed to fetch request details.');
      // The data from the API should conform to our FullRequestForModal type
      const data: FullRequestForModal = await res.json();
      setSelectedRequest(data);
      setIsModalOpen(true);
    } catch (error) { console.error(error); alert('Could not load request details.'); }
  };

  const handleApprove = async (requestId: number) => {
    if (!confirm('Are you sure you want to approve this request?')) return;
    try {
        await fetch(`/api/requests/approve/${requestId}`, { method: 'POST' });
        setRequests(currentRequests => currentRequests.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    } catch (error) { console.error(error); alert('Failed to approve request.'); }
  };

  const handleDeny = async (requestId: number) => {
    const reason = prompt('Please provide a reason for denial:');
    if (!reason || reason.trim() === '') { alert('A reason is required to deny a request.'); return; }
    try {
        await fetch(`/api/requests/deny/${requestId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
        });
        setRequests(currentRequests => currentRequests.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    } catch (error) { console.error(error); alert('Failed to deny request.'); }
  };
  
  // The rest of your JSX remains the same and will work correctly.
  return (
    <div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select id="status-filter" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full rounded-md border-2 border-gray-300 text-gray-900">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
          <select id="type-filter" value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full rounded-md border-2 border-gray-300 text-gray-900">
            <option value="all">All Types</option>
            {requestTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="staff-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Staff</label>
          <select id="staff-filter" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="w-full rounded-md border-2 border-gray-300 text-gray-900">
            <option value="all">All Staff</option>
            {staffList.map(staff => <option key={staff.id} value={staff.id}>{staff.full_name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Employee</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">Submitted</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => (
              <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{req.staff_name}</td>
                <td className="px-6 py-4 text-gray-900">{req.requestable_type}</td>
                
                <td className="px-6 py-4 text-gray-600">
                  {req.requestable_type === 'Leave' && req.start_date && req.end_date && (
                    <span>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</span>
                  )}
                  {req.requestable_type === 'Salary Advance' && (
                    <span className="font-semibold text-gray-800">N$ {parseFloat(req.amount_requested!).toFixed(2)}</span>
                  )}
                  {req.requestable_type === 'Overtime' && (
                    <span>
                        {new Date(req.overtime_date!).toLocaleDateString()}
                        <span className="font-semibold text-gray-800 ml-2">({parseFloat(req.hours_worked!).toFixed(2)} hrs)</span>
                    </span>
                  )}
                  {req.requestable_type === 'Complaint' && (
                    <span className="italic">{req.complaint_nature}</span>
                  )}
                  {req.requestable_type === 'Loan' && (
                    <span className="italic">{req.loan_type}</span>
                  )}
                </td>

                <td className="px-6 py-4 text-gray-600">{new Date(req.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${statusStyles[req.status]}`}>{req.status}</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handlePreview(req.id)} title="Preview" className="p-1 text-gray-500 hover:text-blue-600"><Eye size={18}/></button>
                     <a href={`/api/requests/download/${req.id}`} title="Download Package"><button className="p-1 text-gray-500 hover:text-blue-600"><Download size={18}/></button></a>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(req.id)} title="Approve" className="p-1 text-green-500 hover:text-green-700"><Check size={18}/></button>
                        <button onClick={() => handleDeny(req.id)} title="Deny" className="p-1 text-red-500 hover:text-red-700"><X size={18}/></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && <p className="p-8 text-center text-gray-500">No requests match the current filters.</p>}
      </div>

      {isModalOpen && (<RequestPreviewModal request={selectedRequest} onClose={() => setIsModalOpen(false)} />)}
    </div>
  );
}