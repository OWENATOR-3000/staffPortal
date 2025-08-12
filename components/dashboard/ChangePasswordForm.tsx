// components/dashboard/ChangePasswordForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { Key } from 'lucide-react';

export default function ChangePasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData(event.currentTarget);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/staff/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            setMessage(result.message);
            (event.target as HTMLFormElement).reset(); // Clear form on success
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md mt-8">
            <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-700">Change Password</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label htmlFor="currentPassword" className='text-sm font-medium text-gray-700'>Current Password</label>
                    <input type="password" name="currentPassword" id="currentPassword" required className="mt-1 block w-full rounded-md text-gray-900 border border-gray-300"/>
                </div>
                <div>
                    <label htmlFor="newPassword" className='text-sm font-medium text-gray-700'>New Password</label>
                    <input type="password" name="newPassword" id="newPassword" required className="mt-1 block w-full rounded-md text-gray-900 border border-gray-300"/>
                </div>
                <div>
                    <label htmlFor="confirmPassword" className='text-sm font-medium text-gray-700'>Confirm New Password</label>
                    <input type="password" name="confirmPassword" id="confirmPassword" required className="mt-1 block w-full rounded-md text-gray-900 border border-gray-300"/>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {message && <p className="text-sm text-green-600">{message}</p>}

                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}