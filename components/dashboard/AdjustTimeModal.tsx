"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Helper to format dates for the datetime-local input
const toDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
};

export default function AdjustTimeModal({ recordPair, onClose, onSave }: { recordPair: any, onClose: () => void, onSave: () => void }) {
    const [newClockIn, setNewClockIn] = useState('');
    const [newClockOut, setNewClockOut] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (recordPair) {
            setNewClockIn(toDatetimeLocal(recordPair.clock_in.event_time));
            setNewClockOut(toDatetimeLocal(recordPair.clock_out.event_time));
        }
    }, [recordPair]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/attendance/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clockInId: recordPair.clock_in.id,
                    clockOutId: recordPair.clock_out.id,
                    newClockIn: new Date(newClockIn).toISOString(),
                    newClockOut: new Date(newClockOut).toISOString(),
                    reason,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!recordPair) return null;

    return (
        // The modal's JSX structure can remain mostly the same
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold">Adjust Time for {recordPair.staff_name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Form fields are the same */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                       <div>
                            <label className="block text-sm font-medium text-gray-700">Clock In</label>
                            <input type="datetime-local" value={newClockIn} onChange={e => setNewClockIn(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Clock Out</label>
                            <input type="datetime-local" value={newClockOut} onChange={e => setNewClockOut(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" rows={3} placeholder="e.g., Employee provided proof of working late." required></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded">{error}</p>}
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}