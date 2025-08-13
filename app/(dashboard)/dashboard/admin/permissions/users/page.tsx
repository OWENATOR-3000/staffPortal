// app/dashboard/admin/permissions/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { RowDataPacket } from 'mysql2';

// Define types for clarity
interface Permission extends RowDataPacket { id: number; name: string; }
interface StaffMember extends RowDataPacket { id: number; full_name: string; }

export default function UserPermissionsPage() {
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [assignedPermissions, setAssignedPermissions] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Fetch initial data (all staff and all permissions)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/user-permissions');
                const data = await res.json();
                setStaffList(data.allStaff);
                setPermissions(data.allPermissions);
                if (data.allStaff && data.allStaff.length > 0) {
                    setSelectedStaffId(data.allStaff[0].id.toString());
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setMessage("Failed to load data. Please refresh the page.");
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Re-fetch assigned permissions when a new user is selected
    useEffect(() => {
        if (!selectedStaffId) return;
        const fetchAssigned = async () => {
            setIsLoading(true);
            setMessage('');
            try {
                const res = await fetch(`/api/user-permissions?staffId=${selectedStaffId}`);
                const data = await res.json();
                setAssignedPermissions(new Set(data.assignedPermissionIds));
            } catch (error) {
                console.error("Failed to fetch assigned permissions:", error);
                setMessage("Failed to load permissions for the selected user.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssigned();
    }, [selectedStaffId]);

    const handlePermissionChange = (permissionId: number, isChecked: boolean) => {
        setAssignedPermissions(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(permissionId);
            } else {
                newSet.delete(permissionId);
            }
            return newSet;
        });
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetch('/api/user-permissions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: parseInt(selectedStaffId),
                    permissionIds: Array.from(assignedPermissions),
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setMessage('User permissions updated successfully!');
        } catch (err: unknown) {
            setMessage(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manage User-Specific Permissions</h1>
                <p className="text-gray-600">Grant individual permissions to a user that override their role.</p>
            </div>
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b flex items-center space-x-4">
                    <label htmlFor="staff-select" className="text-lg font-semibold text-gray-700">Staff Member:</label>
                    <select
                        id="staff-select"
                        value={selectedStaffId}
                        onChange={e => setSelectedStaffId(e.target.value)}
                        className="p-2 border-gray-300 rounded-md shadow-sm text-gray-900"
                        disabled={isLoading}
                    >
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                        ))}
                    </select>
                </div>
                
                {isLoading && <p className="p-6 text-gray-500 animate-pulse">Loading permissions...</p>}

                {!isLoading && selectedStaffId && (
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Permissions for {staffList.find(s => s.id.toString() === selectedStaffId)?.full_name}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={assignedPermissions.has(permission.id)}
                                        onChange={e => handlePermissionChange(permission.id, e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{permission.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="p-6 bg-gray-50 border-t flex justify-end items-center space-x-4">
                    {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading || !selectedStaffId}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
}