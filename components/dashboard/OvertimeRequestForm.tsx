

// components/dashboard/OvertimeRequestForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function OvertimeRequestForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch('/api/requests/overtime', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit request.');
            
            router.push('/dashboard'); 
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="overtimeDate" className="block text-sm font-medium text-gray-700">Date of Overtime</label>
                <input 
                    type="date" 
                    name="overtimeDate" 
                    id="overtimeDate" 
                    required 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                />
            </div>
            
            {/* --- NEW SECTION FOR OVERTIME TYPE --- */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Type of Overtime</label>
                <fieldset className="mt-2">
                    <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                            <input 
                                type="radio" 
                                name="overtimeType" 
                                value="Normal" 
                                defaultChecked 
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Normal (1.5x Rate)</span>
                        </label>
                        <label className="flex items-center">
                            <input 
                                type="radio" 
                                name="overtimeType" 
                                value="Sunday" 
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Sunday (2.0x Rate)</span>
                        </label>
                    </div>
                </fieldset>
            </div>
            
            <div>
                <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-700">Hours Worked</label>
                <input 
                    type="number" 
                    name="hoursWorked" 
                    id="hoursWorked" 
                    required 
                    step="0.25" 
                    min="0"
                    placeholder="e.g., 2.5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                />
            </div>
            
            <div>
                 <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Overtime</label>
                 <textarea 
                    name="reason" 
                    id="reason" 
                    required 
                    rows={4} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                ></textarea>
            </div>

            {error && <p className="text-sm text-center text-red-600">{error}</p>}

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-semibold disabled:bg-gray-400">
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}