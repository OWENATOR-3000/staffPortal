// File: components/dashboard/AttendanceLogViewer.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { RowDataPacket } from 'mysql2';
import { format } from 'date-fns';
import AdjustTimeModal from './AdjustTimeModal';

interface StaffOption extends RowDataPacket { id: number; full_name: string; }

type ViewType = 'summary' | 'detail';

interface SummaryLog {
    staff_id: number;
    full_name: string;
    attendance_date: string;
    first_clock_in: string;
    last_clock_out: string | null;
    total_seconds_worked: number;
    clock_in_id: number;
    clock_out_id: number | null;
    clock_out_source: 'user' | 'system' | 'adjusted' | null;
}
interface DetailLog {
    id: number;
    event_type: 'clock_in' | 'clock_out';
    event_time: string;
    full_name: string;
}

export default function AttendanceLogViewer({ staffList }: { staffList: StaffOption[] }) {
    const [logs, setLogs] = useState<(SummaryLog | DetailLog)[]>([]);
    const [view, setView] = useState<ViewType>('summary');
    const [isLoading, setIsLoading] = useState(true);
    
    const [staffId, setStaffId] = useState('all');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<SummaryLog | null>(null);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ startDate, endDate, staffId });
            const response = await fetch(`/api/attendance/log?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch logs.');
            }
            const data = await response.json();
            setLogs(data.logs);
            setView(data.view);
        } catch (error) {
            console.error(error);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [staffId, startDate, endDate]);
    
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleOpenModal = (record: SummaryLog) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
    };

    const handleSaveChanges = () => {
        handleCloseModal();
        fetchLogs();
    };


    const formatSeconds = (seconds: number) => {
        if (!seconds || seconds < 0) return '00h 00m 00s';
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-gray-900"/>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-gray-900"/>
                </div>
                <div>
                    <label htmlFor="staff-filter" className="block text-sm font-medium text-gray-700">Employee</label>
                    <select id="staff-filter" value={staffId} onChange={e => setStaffId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-gray-900">
                        <option value="all">All Staff (Summary View)</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading && <p className="text-center p-8 text-gray-500 animate-pulse">Loading log entries...</p>}
                {!isLoading && logs.length === 0 && <p className="text-center p-8 text-gray-500">No records found for the selected criteria.</p>}
                
                {!isLoading && logs.length > 0 && view === 'summary' && (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3">First Clock-In</th>
                                <th className="px-6 py-3">Last Clock-Out</th>
                                <th className="px-6 py-3">Total Hours Worked</th>
                                <th className="px-6 py-3">Status / Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(logs as SummaryLog[]).map(log => (
                                <tr key={`${log.staff_id}-${log.attendance_date}`} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{new Date(log.attendance_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-900">{log.full_name}</td>
                                    <td className="px-6 py-4 text-gray-900">{new Date(log.first_clock_in).toLocaleTimeString()}</td>
                                    <td className="px-6 py-4 text-gray-900">{log.last_clock_out ? new Date(log.last_clock_out).toLocaleTimeString() : <span className="text-red-500 italic">Missing Clock-Out</span>}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-800">{formatSeconds(log.total_seconds_worked)}</td>
                                    <td className="px-6 py-4">
                                        {log.clock_out_source === 'system' ? (
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Absent (Auto)</span>
                                                <button 
                                                    onClick={() => handleOpenModal(log)}
                                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                                >
                                                    Adjust
                                                </button>
                                            </div>
                                        ) : log.clock_out_source === 'adjusted' ? (
                                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Present (Adjusted)</span>
                                        ) : log.last_clock_out ? (
                                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Present</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">In Progress</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                
                {!isLoading && logs.length > 0 && view === 'detail' && (
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Event</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(logs as DetailLog[]).map(log => (
                                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 ">{new Date(log.event_time).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${log.event_type === 'clock_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {log.event_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && selectedRecord && selectedRecord.clock_out_id && selectedRecord.last_clock_out && (
                <AdjustTimeModal
                    recordPair={{
                        staff_name: selectedRecord.full_name,
                        clock_in: { id: selectedRecord.clock_in_id, event_time: selectedRecord.first_clock_in },
                        // Inside this block, TypeScript knows clock_out_id is a 'number' and last_clock_out is a 'string'.
                        clock_out: { id: selectedRecord.clock_out_id, event_time: selectedRecord.last_clock_out }
                    }}
                    onClose={handleCloseModal}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
}