// app/dashboard/admin/permissions/roles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { RowDataPacket } from 'mysql2';

// Type definitions for our data
interface Permission extends RowDataPacket { id: number; name: string; }
interface Role extends RowDataPacket { id: number; name: string; }

export default function RolePermissionsPage() {
    // State management hooks
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [assignedPermissions, setAssignedPermissions] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    // --- LOGIC FUNCTIONS ---

    // 1. Fetch initial data (all roles and permissions) when the component first loads
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/permissions');
                if (!res.ok) throw new Error('Failed to fetch initial data.');
                
                const data = await res.json();
                setRoles(data.allRoles || []);
                setPermissions(data.allPermissions || []);
                
                if (data.allRoles && data.allRoles.length > 0) {
                    setSelectedRoleId(data.allRoles[0].id.toString());
                } else {
                    setIsLoading(false); // Stop loading if there are no roles
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setMessage("Error: Failed to load page data. Please refresh.");
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. Fetch the assigned permissions for a role whenever the selected role changes
    useEffect(() => {
        if (!selectedRoleId) return;

        const fetchAssigned = async () => {
            setIsLoading(true);
            setMessage('');
            try {
                const res = await fetch(`/api/permissions?roleId=${selectedRoleId}`);
                if (!res.ok) throw new Error('Failed to fetch permissions for this role.');
                
                const data = await res.json();
                setAssignedPermissions(new Set(data.assignedPermissionIds || []));
            } catch (error) {
                console.error("Failed to fetch assigned permissions:", error);
                setMessage("Error: Could not load permissions for the selected role.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssigned();
    }, [selectedRoleId]);

    // 3. Handle checking/unchecking a permission checkbox
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

    // 4. Handle saving the changes to the database
    const handleSaveChanges = async () => {
        if (!selectedRoleId) return;
        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetch('/api/permissions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleId: parseInt(selectedRoleId),
                    permissionIds: Array.from(assignedPermissions),
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Unknown error occurred.');
            
            setMessage('Permissions updated successfully!');
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- JSX RENDER ---
    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manage Role Permissions</h1>
                <p className="text-gray-600">Select a role to view and edit its assigned permissions.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-15rem)]">
                {/* TOP FILTER SECTION */}
                <div className="p-6 border-b flex items-center space-x-4 flex-shrink-0">
                    <label htmlFor="role-select" className="text-lg font-semibold text-gray-700">Role:</label>
                    <select
                        id="role-select"
                        value={selectedRoleId}
                        onChange={e => setSelectedRoleId(e.target.value)}
                        className="p-2 border-gray-300 rounded-md shadow-sm text-gray-900"
                        disabled={isLoading}
                    >
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* SCROLLING CONTENT AREA */}
                <div className="flex-grow overflow-y-auto p-6">
                    {isLoading && <p className="text-gray-500 animate-pulse">Loading permissions...</p>}

                    {!isLoading && selectedRoleId && (
                        <div>
                            <h2 className="text-gray-700 text-xl font-semibold mb-4">Permissions for {roles.find(r => r.id.toString() === selectedRoleId)?.name}</h2>
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
                </div>
                
                {/* FIXED FOOTER SECTION */}
                <div className="p-6 bg-gray-50 border-t flex justify-end items-center space-x-4 flex-shrink-0">
                    {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading || !selectedRoleId}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
}