// components/dashboard/MyAttendanceViewer.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';

// Use the same 'SummaryLog' type from the admin viewer
interface SummaryLog {
    staff_id: number;
    full_name: string;
    attendance_date: string;
    first_clock_in: string;
    last_clock_out: string | null;
    total_seconds_worked: number;
}

export default function MyAttendanceViewer({ staffId }: { staffId: number }) {
    const [logs, setLogs] = useState<SummaryLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for date filters
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const fetchMyLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            // --- THIS IS THE KEY CHANGE ---
            // We fetch the 'summary' view for the selected date range.
            // We will filter by the user's ID on the client side.
            const params = new URLSearchParams({ 
                startDate, 
                endDate, 
                staffId: 'all' // Always request the summary view
            });
            const response = await fetch(`/api/attendance/log?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch attendance records.');
            }
            
            const data = await response.json();
            
            // Filter the summary data to only include the current user's records
            const myLogs = data.logs.filter((log: SummaryLog) => log.staff_id === staffId);
            setLogs(myLogs);

        } catch (error) {
            console.error(error);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [staffId, startDate, endDate]);
    
    useEffect(() => {
        fetchMyLogs();
    }, [fetchMyLogs]);

    // Helper function to format seconds into hh:mm:ss
    const formatSeconds = (seconds: number) => {
        if (!seconds || seconds < 0) return '00h 00m 00s';
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="space-y-4">
            {/* Filter Section */}
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="my-start-date" className="block text-sm font-medium text-gray-700">From Date</label>
                    <input type="date" id="my-start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-2 border-gray-300 text-gray-900"/>
                </div>
                <div>
                    <label htmlFor="my-end-date" className="block text-sm font-medium text-gray-700">To Date</label>
                    <input type="date" id="my-end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-2 border-gray-300 text-gray-900"/>
                </div>
            </div>

            {/* --- THIS IS THE NEW SUMMARY TABLE --- */}
            <div className="overflow-x-auto">
                {isLoading && <p className="text-center p-8 text-gray-500 animate-pulse">Loading your records...</p>}
                
                {!isLoading && (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">First Clock-In</th>
                                <th className="px-6 py-3">Last Clock-Out</th>
                                <th className="px-6 py-3">Total Hours Worked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                logs.map(log => (
                                    <tr key={log.attendance_date} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{new Date(log.attendance_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-900">{new Date(log.first_clock_in).toLocaleTimeString()}</td>
                                        <td className="px-6 py-4 text-gray-900">{log.last_clock_out ? new Date(log.last_clock_out).toLocaleTimeString() : <span className="text-gray-900 italic">In Progress</span>}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{formatSeconds(log.total_seconds_worked)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center px-6 py-12 text-gray-500">
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}