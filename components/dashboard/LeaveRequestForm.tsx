// components/dashboard/LeaveRequestForm.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const reasonOptions = [
    'Vacation', 'Leave of Absence', 'Sick - Family', 'Sick - Self', 
    'Dr. Appointment', 'Funeral', 'Other'
];

// --- CHANGE 1: Get today's date in YYYY-MM-DD format ---
const getTodayString = () => {
    const today = new Date();
    // Adjust for timezone to prevent off-by-one day errors
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
};

export default function LeaveRequestForm({ employeeName }: { employeeName: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [numberOfDays, setNumberOfDays] = useState(0);
    // --- CHANGE 2: Add state for specific date validation errors ---
    const [dateError, setDateError] = useState('');
    const router = useRouter();

    const today = getTodayString();

    // --- CHANGE 3: Enhance useEffect for robust validation and day calculation ---
    useEffect(() => {
        // Clear previous errors whenever dates change
        setDateError('');
        setError('');

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Validation: End date cannot be before start date
            if (end < start) {
                setDateError('The "To" date cannot be earlier than the "From" date.');
                setNumberOfDays(0);
                return; // Stop calculation
            }

            // If valid, calculate the number of days
            const diffTime = end.getTime() - start.getTime();
            // The +1 makes the range inclusive (e.g., 16th to 16th is 1 day)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setNumberOfDays(diffDays);
        } else {
            setNumberOfDays(0);
        }
    }, [startDate, endDate]);

    // --- CHANGE 4: Strengthen the submit handler ---
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Final validation check before submitting
        if (dateError) {
            setError('Please fix the errors in the form before submitting.');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select both a "From" and "To" date.');
            return;
        }

        setIsLoading(true);
        setError('');
        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch('/api/requests/leave', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit request.');
            
            router.push('/dashboard'); 
            router.refresh();

        }          catch (err) { // Removed ': any'
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
        <form onSubmit={handleSubmit} className="space-y-8 p-6 max-w-4xl mx-auto border rounded-md shadow bg-white">
            {/* ... (rest of the form header is unchanged) ... */}
            <div className="flex items-center justify-between border-b pb-4">
                <Image src="/GMLogo.png" alt="Company Logo" width={80} height={50} />
                <h2 className="text-2xl font-bold text-gray-800 text-center flex-grow -ml-20">Employee Leave Request Form</h2>
            </div>

            {/* ... (Employee/Date/Supervisor section is unchanged) ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Employee Name</label>
                    <input type="text" readOnly value={employeeName} className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 text-gray-700" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <input type="text" readOnly value={new Date().toLocaleDateString()} className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 text-gray-700" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Supervisor Name</label>
                    <input type="text" name="supervisorName" id="supervisorName" className="mt-1 block w-full rounded-md border-gray-300 text-gray-900" required />
                </div>
            </div>

            {/* ... (Reason for Leave section is unchanged) ... */}
            <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Reason for Leave</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reasonOptions.map(reason => (
                    <label key={reason} className="flex items-center text-sm text-gray-700 space-x-2">
                    <input
                        type="radio"
                        name="reasonType"
                        value={reason}
                        className="h-4 w-4 text-blue-600 border-gray-300"
                        onChange={e => setSelectedReason(e.target.value)}
                        required
                    />
                    <span>{reason}</span>
                    </label>
                ))}
                </div>
                {(selectedReason === 'Funeral' || selectedReason === 'Other') && (
                <div className="mt-4">
                    <label htmlFor="reasonDetails" className="block text-sm font-medium text-gray-700">
                    {selectedReason === 'Funeral' ? 'Funeral For:' : 'Please specify:'}
                    </label>
                    <input type="text" name="reasonDetails" id="reasonDetails" className="mt-1 block w-full rounded-md border-gray-300 text-gray-900" />
                </div>
                )}
            </div>

            {/* --- CHANGE 5: Apply min attributes to date inputs and display date error --- */}
            <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Leave Requested</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">From</label>
                        <input 
                            type="date" 
                            name="startDate" 
                            id="startDate" 
                            required 
                            value={startDate} 
                            min={today} // Prevents selecting past dates
                            onChange={e => setStartDate(e.target.value)} 
                            className="mt-1 block w-full rounded-md border-gray-300 text-gray-900" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">To</label>
                        <input 
                            type="date" 
                            name="endDate" 
                            id="endDate" 
                            required 
                            value={endDate} 
                            min={startDate || today} // Prevents selecting a date before the start date
                            onChange={e => setEndDate(e.target.value)} 
                            className="mt-1 block w-full rounded-md border-gray-300 text-gray-900" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Hours</label>
                        <input type="number" step="0.5" name="numberOfHours" id="numberOfHours" className="mt-1 block w-full rounded-md border-gray-300 text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Number of Days</label>
                        <input type="text" readOnly value={numberOfDays} className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 text-gray-700" />
                    </div>
                </div>
                {/* Display the specific date error message right below the inputs */}
                {dateError && <p className="text-red-600 text-sm mt-2">{dateError}</p>}
            </div>

            {/* ... (rest of the form is unchanged) ... */}
            <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700">Comment(s)</label>
                <textarea name="comments" id="comments" rows={3} className="mt-1 block w-full rounded-md border-gray-300 text-gray-900 shadow-sm" />
            </div>

            <div>
                <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attach Document (Optional)</label>
                <p className="text-xs text-gray-500 mb-1">e.g., Doctor&apos;s note for sick leave.</p>
                <input type="file" name="attachment" id="attachment" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                <label htmlFor="employeeSignatureName" className="block text-sm font-medium text-gray-700">Employee Signature</label>
                <p className="text-xs text-gray-500 mb-2">Typing your full name serves as your digital signature.</p>
                <input type="text" name="employeeSignatureName" id="employeeSignatureName" required defaultValue={employeeName} className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm" />
                </div>
                <div>
                <label htmlFor="supervisorSignature" className="block text-sm font-medium text-gray-700">Supervisor Signature</label>
                <input type="text" name="supervisorSignature" id="supervisorSignature" className="block w-full rounded-md border-gray-300 text-gray-900 shadow-sm" />
                </div>
            </div>

            {/* Display the general submission error */}
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <div className="flex justify-end">
                <button type="submit" disabled={isLoading || !!dateError} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </form>
    );
}