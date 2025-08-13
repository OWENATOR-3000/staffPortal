// components/dashboard/LoanRequestForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoanRequestForm({ employeeName }: { employeeName: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch('/api/requests/loan', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to submit request.');
            
            alert(result.message);
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Loan Amount Requested (N$)</label>
                <input type="number" name="amount" id="amount" required step="0.01" min="0" placeholder="e.g., 10000.00" className="mt-1 block border-2 w-full rounded-md border-gray-300 text-gray-900"/>
            </div>

            <div>
                <label htmlFor="loanType" className="block text-sm font-medium text-gray-700">Type of Loan</label>
                <input type="text" name="loanType" id="loanType" required placeholder="e.g., School Fees, Emergency Medical" className="mt-1 block border-2 w-full rounded-md border-gray-300 text-gray-900"/>
            </div>
            
            <div>
                 <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Loan</label>
                 <p className="text-xs text-gray-500">Briefly explain why you are requesting this loan.</p>
                 <textarea name="reason" id="reason" required rows={4} className="mt-1 block border-2 w-full rounded-md border-gray-300 text-gray-900"></textarea>
            </div>

            <div>
                 <label htmlFor="repaymentTerms" className="block text-sm font-medium text-gray-700">Proposed Repayment Terms (Optional)</label>
                 <p className="text-xs text-gray-500">How do you propose to repay this loan?</p>
                 <textarea name="repaymentTerms" id="repaymentTerms" rows={3} className="mt-1 block border-2 w-full rounded-md border-gray-300 text-gray-900"></textarea>
            </div>

            <div className="pt-4 border-t">
                <label htmlFor="signature" className="block text-sm font-medium text-gray-700">Employee Signature</label>
                <p className="text-xs text-gray-500 mb-1">Typing your full name serves as your digital signature.</p>
                <input type="text" name="signature" id="signature" required defaultValue={employeeName} className="mt-1 block border-2 w-full rounded-md border-gray-300 text-gray-900"/>
            </div>

            {error && <p className="text-sm text-center text-red-600">{error}</p>}

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-semibold disabled:bg-gray-400">
                    {isLoading ? 'Submitting...' : 'Submit Loan Request'}
                </button>
            </div>
        </form>
    );
}