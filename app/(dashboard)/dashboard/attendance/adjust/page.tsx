// File: app/(dashboard)/dashboard/attendance/adjust/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import AdjustTimeModal from '@/components/dashboard/AdjustTimeModal';

// This is a simplified staff type for the dropdown
interface Staff {
    id: number;
    full_name: string;
}

// Type for the paired shifts we get from our new API
interface Shift {
    clock_in_id: number;
    clock_in_time: string;
    clock_out_id: number | null;
    clock_out_time: string | null;
    clock_out_source: 'user' | 'system' | 'adjusted' | null;
    staff_name?: string;
}

export default function AdjustAttendancePage() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [filters, setFilters] = useState({
        staffId: '',
        searchDate: new Date().toISOString().slice(0, 10)
    });
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // State for the modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    // Fetch the list of staff for the dropdown
    useEffect(() => {
        async function fetchStaff() {
            try {
                const res = await fetch('/api/staff'); // Assuming you have an API to get staff
                if (!res.ok) throw new Error('Failed to fetch staff list.');
                const data = await res.json();
                setStaffList(data.staff);
            } catch (err: unknown) {
                console.error("Failed to fetch staff list:", err);
            }
        }
        fetchStaff();
    }, []);

    const handleSearch = async () => {
        if (!filters.staffId || !filters.searchDate) {
            setError('Please select an employee and a date.');
            return;
        }
        setIsLoading(true);
        setError('');
        setShifts([]);

        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`/api/attendance/search-shifts?${params.toString()}`);
            if (!res.ok) throw new Error(await res.json().then(d => d.message));
            const data = await res.json();
            setShifts(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (shift: Shift) => {
        // Find the staff member's name to pass to the modal
        const staffMember = staffList.find(s => s.id === Number(filters.staffId));
        setSelectedShift({ ...shift, staff_name: staffMember?.full_name || 'Employee' });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Manual Time Adjustment</h1>

            {/* Search and Filter Card */}
            <div className="p-4 bg-white rounded-lg shadow space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Find Attendance Record</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Employee</label>
                        <select 
                            value={filters.staffId} 
                            onChange={e => setFilters({...filters, staffId: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 text-gray-900"
                        >
                            <option value="">-- Select an Employee --</option>
                            {staffList.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input 
                            type="date" 
                            value={filters.searchDate} 
                            onChange={e => setFilters({...filters, searchDate: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 text-gray-900"
                        />
                    </div>
                    <button onClick={handleSearch} disabled={isLoading} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        <Search size={18} />
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {shifts.map((shift) => (
                            <tr key={shift.clock_in_id}>
                                <td className="px-6 py-4 text-gray-900">{new Date(shift.clock_in_time).toLocaleString()}</td>
                                <td className="px-6 py-4 text-gray-900">{shift.clock_out_time ? new Date(shift.clock_out_time).toLocaleString() : 'N/A'}</td>
                                <td className="px-6 py-4 text-gray-900 capitalize">{shift.clock_out_source || 'In Progress'}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleOpenModal(shift)}
                                        className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                                    >
                                        Adjust
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {!isLoading && shifts.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-500">No shifts found for this selection.</td></tr>
                         )}
                    </tbody>
                </table>
            </div>

                   {isModalOpen && selectedShift && selectedShift.staff_name && selectedShift.clock_out_id && selectedShift.clock_out_time && (
                <AdjustTimeModal
                    recordPair={{
                        // Inside this block, TypeScript knows these values are not null or undefined.
                        staff_name: selectedShift.staff_name,
                        clock_in: { id: selectedShift.clock_in_id, event_time: selectedShift.clock_in_time },
                        clock_out: { id: selectedShift.clock_out_id, event_time: selectedShift.clock_out_time }
                    }}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        handleSearch(); // Refresh the search results after saving
                    }}
                />
            )}
        </div>
    );
}