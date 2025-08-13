// components/dashboard/SalaryAdvanceForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SalaryAdvanceForm({ employeeName }: { employeeName: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch('/api/requests/salary-advance', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit request.');
            
            router.push('/dashboard'); 
            router.refresh();
        } catch (err) { // Removed ': any'
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
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <Image src="/glogo.png" alt="Company Logo" width={80} height={80} className="mx-auto mb-4"/>
                <h2 className="text-2xl font-bold text-gray-800">Request for Advance on Salary</h2>
            </div>
            
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Name</label>
                    <input type="text" readOnly value={employeeName} className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 text-gray-900"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="text" readOnly value={new Date().toLocaleDateString()} className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 text-gray-900"/>
                </div>
            </div>

            <div className="space-y-4 text-gray-700">
                <p className="flex items-center flex-wrap gap-x-2">
                    I,
                    <span className="font-semibold">{employeeName}</span>,
                    request an advance payment of 
                    <span className="inline-flex items-center">
                        N$
                        <input type="number" name="amount" required step="0.01" className="w-32 mx-1 rounded-md border-2 border-gray-300 text-gray-900"/>
                    </span>
                     on my salary to be paid on
                    <input type="date" name="paidOnDate" required className="mx-1 rounded-md border-2 border-gray-300 text-gray-900"/>
                    as permitted by company policy.
                </p>
            </div>
            
            <div>
                 <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason:</label>
                 <textarea name="reason" id="reason" required rows={4} className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm text-gray-900"></textarea>
            </div>

            <div className="p-4 border rounded-md bg-gray-50 text-sm text-gray-600 space-y-2">
                <h4 className="font-semibold">I agree to repay this advance as follows:</h4>
                <p>
                    A lump-sum payroll deduction to be made from my salary on the first pay period
                    immediately following the pay period from which this advance is made. I also agree that
                    if I terminate employment prior to total repayment of this advance, I authorize the
                    company to deduct any unpaid advance amount from the salary owed me at the time of
                    termination of employment.
                </p>
            </div>

            <div className="pt-6 border-t mt-6">
                <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Employee Signature</label>
                <p className="text-xs text-gray-500 mb-2">Typing your full name serves as your digital signature.</p>
                <input 
                    type="text" 
                    name="signature" 
                    id="signature" 
                    required 
                    defaultValue={employeeName}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                />
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