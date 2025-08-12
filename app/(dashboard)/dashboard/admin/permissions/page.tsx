// app/dashboard/admin/permissions/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { RowDataPacket } from 'mysql2';

interface Permission extends RowDataPacket { id: number; name: string; }
interface Role extends RowDataPacket { id: number; name: string; }

export default function PermissionsPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [assignedPermissions, setAssignedPermissions] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch initial data (all roles and permissions)
    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch('/api/permissions');
            const data = await res.json();
            setRoles(data.allRoles);
            setPermissions(data.allPermissions);
            if (data.allRoles.length > 0) {
                // Select the first role by default
                setSelectedRoleId(data.allRoles[0].id.toString());
            }
        };
        fetchData();
    }, []);

    // Fetch assigned permissions whenever the selected role changes
    useEffect(() => {
        if (!selectedRoleId) return;
        const fetchAssigned = async () => {
            setIsLoading(true);
            const res = await fetch(`/api/permissions?roleId=${selectedRoleId}`);
            const data = await res.json();
            setAssignedPermissions(new Set(data.assignedPermissionIds));
            setIsLoading(false);
        };
        fetchAssigned();
    }, [selectedRoleId]);

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
            const response = await fetch('/api/permissions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleId: parseInt(selectedRoleId),
                    permissionIds: Array.from(assignedPermissions),
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setMessage('Permissions updated successfully!');
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manage Role Permissions</h1>
                <p className="text-gray-600">Select a role to view and edit its assigned permissions.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b flex items-center space-x-4">
                    <label htmlFor="role-select" className="text-lg font-semibold text-gray-700">Role:</label>
                    <select
                        id="role-select"
                        value={selectedRoleId}
                        onChange={e => setSelectedRoleId(e.target.value)}
                        className="p-2 border-gray-300 rounded-md shadow-sm text-gray-900"
                    >
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
                
                {isLoading && <p className="p-6">Loading permissions...</p>}

                {!isLoading && selectedRoleId && (
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Permissions for {roles.find(r => r.id.toString() === selectedRoleId)?.name}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100">
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
                    {message && <p className="text-sm text-gray-600">{message}</p>}
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
}