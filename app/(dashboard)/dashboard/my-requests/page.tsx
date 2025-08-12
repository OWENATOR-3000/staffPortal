// app/dashboard/my-requests/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { RowDataPacket } from 'mysql2';

interface MyRequest extends RowDataPacket {
    id: number;
    requestable_type: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    details: string;
    rejection_reason: string | null;
}

// Reusable status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const styles: { [key: string]: string } = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${styles[status]}`}>
            {status}
        </span>
    );
};

export default function MyRequestsPage() {
    const [requests, setRequests] = useState<MyRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch('/api/requests/my-requests');
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to fetch requests.');
                setRequests(data.requests);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequests();
    }, []);

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Request History</h1>
                <p className="text-gray-600">Track the status of all your submitted requests.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="p-8 text-center text-gray-500">Loading your requests...</p>
                    ) : error ? (
                        <p className="p-8 text-center text-red-500">{error}</p>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Request Type</th>
                                    <th className="px-6 py-3">Details</th>
                                    <th className="px-6 py-3">Date Submitted</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length > 0 ? (
                                    requests.map((req) => (
                                        <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{req.requestable_type}</td>
                                            <td className="px-6 py-4 text-gray-600">{req.details}</td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(req.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={req.status} />
                                                {req.status === 'rejected' && req.rejection_reason && (
                                                    <p className="text-xs text-red-700 mt-1 italic">Reason: {req.rejection_reason}</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center px-6 py-12 text-gray-500">
                                            You have not submitted any requests yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}