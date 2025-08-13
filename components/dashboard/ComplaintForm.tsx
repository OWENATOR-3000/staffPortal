// components/dashboard/ComplaintForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const complaintTypes = ['Harassment', 'Unfair Treatment', 'Workplace Safety', 'Other'];

// FIX 1: Define a specific interface for the user prop
interface User {
    full_name: string;
    department: string;
    primary_phone_number: string;
}

export default function ComplaintForm({ user }: { user: User | null }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedNature, setSelectedNature] = useState('');
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch('/api/requests/complaint', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit complaint.');
            
            alert('Your complaint has been submitted successfully.');
            router.push('/dashboard');
            router.refresh();
        } catch (err) { // FIX 2: Removed ': any'
            // Safely get the error message using a type guard
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* The optional chaining (?.) is already correctly handling the 'null' case */}
                    <div><label className="block text-sm text-gray-900">Full Name</label><input type="text" readOnly value={user?.full_name || ''} className="mt-1 block w-full bg-gray-100 rounded-md text-gray-900"/></div>
                    <div><label className="block text-sm text-gray-900">Department</label><input type="text" readOnly value={user?.department || ''} className="mt-1 block w-full bg-gray-100 rounded-md text-gray-900"/></div>
                    <div><label className="block text-sm text-gray-900">Contact Number</label><input type="text" readOnly value={user?.primary_phone_number || ''} className="mt-1 block w-full bg-gray-100 rounded-md text-gray-900"/></div>
                </div>
            </div>

            {/* ... rest of your JSX remains the same ... */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Complaint Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label htmlFor="incidentDate" className="block  text-sm text-gray-900">Date of Incident</label><input type="date" name="incidentDate" id="incidentDate" required className="mt-1 block w-full border-2 rounded-md text-gray-900"/></div>
                    <div><label htmlFor="incidentTime" className="block  text-sm text-gray-900">Time of Incident</label><input type="time" name="incidentTime" id="incidentTime" className="mt-1 block w-full border-2 rounded-md text-gray-900"/></div>
                    <div><label htmlFor="location" className="block  text-sm text-gray-900">Location</label><input type="text" name="location" id="location" className="mt-1 block w-full border-2 rounded-md text-gray-900"/></div>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-medium text-gray-900">Nature of Complaint</h3>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    {complaintTypes.map(type => (
                        <label key={type} className="flex items-center space-x-2 text-gray-900"><input type="radio" name="complaintNature" value={type} required onChange={e => setSelectedNature(e.target.value)} /><span>{type}</span></label>
                    ))}
                </div>
                {selectedNature === 'Other' && (
                    <div className="mt-4"><label htmlFor="complaintNatureOther" className="block text-sm text-gray-900">If other, please specify:</label><input type="text" name="complaintNatureOther" id="complaintNatureOther" required className="mt-1 block w-full border-2 rounded-md text-gray-900"/></div>
                )}
            </div>

            <div><label htmlFor="description" className='block text-sm text-gray-900'>Description of the Complaint</label><textarea name="description" id="description" required rows={5} className="mt-1 block w-full border-2 rounded-md text-gray-900"></textarea></div>
            <div><label htmlFor="desiredResolution" className='block text-sm text-gray-900'>Desired Resolution <span className="text-gray-500">(What resolution are you seeking?)</span></label><textarea name="desiredResolution" id="desiredResolution" rows={3} className="mt-1 block w-full border-2 rounded-md text-gray-900"></textarea></div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Acknowledgment</h3>
                <label className="mt-2 flex items-center space-x-2 text-gray-900"><input type="checkbox" name="acknowledgment" required /><span>I confirm the above information is true to the best of my knowledge.</span></label>
            </div>

            {error && <p className="text-sm text-center text-red-600">{error}</p>}
            <div className="flex justify-end pt-4"><button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm font-semibold">{isLoading ? 'Submitting...' : 'Submit Complaint'}</button></div>
        </form>
    );
}