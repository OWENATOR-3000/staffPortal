// components/dashboard/CommissionCalculator.tsx
"use client";

import { useState, useMemo } from 'react';
import { RowDataPacket } from 'mysql2';
// FIX 1: 'useRouter' is not used, so it's removed from the import.
import { PlusCircle, Trash2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface StaffOption extends RowDataPacket { 
    id: number; 
    full_name: string; 
}

// Define the type for the category state for better type safety
type CommissionCategory = 'Software' | 'Hardware';

interface LineItem {
    id: number;
    quantity: number;
    itemName: string;
    description: string;
    purchasingPrice: number;
    sellingPrice: number;
}

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(amount);
};

// --- MAIN COMPONENT ---
export default function CommissionCalculator({ staffList }: { staffList: StaffOption[] }) {
    const [category, setCategory] = useState<CommissionCategory>('Software');
    const [items, setItems] = useState<LineItem[]>([{ id: Date.now(), quantity: 1, itemName: '', description: '', purchasingPrice: 0, sellingPrice: 0 }]);
    const [hardwareRate, setHardwareRate] = useState(10);
    const [staffId, setStaffId] = useState<string>(staffList[0]?.id.toString() || '');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // FIX 2: 'value' is now strongly typed
    const handleItemChange = (id: number, field: keyof LineItem, value: string | number) => {
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const addRow = () => {
        setItems(currentItems => [...currentItems, { id: Date.now(), quantity: 1, itemName: '', description: '', purchasingPrice: 0, sellingPrice: 0 }]);
    };
    
    const removeRow = (id: number) => {
        if (items.length > 1) {
            setItems(currentItems => currentItems.filter(item => item.id !== id));
        }
    };

    const calculations = useMemo(() => {
        const itemsWithTotals = items.map(item => ({
            ...item,
            lineTotal: item.quantity * (item.sellingPrice - item.purchasingPrice)
        }));
        const totalProfit = itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);
        const commissionRate = category === 'Software' ? 0.10 : hardwareRate / 100;
        const commissionEarned = totalProfit * commissionRate;
        return { itemsWithTotals, totalProfit, commissionRate, commissionEarned };
    }, [items, category, hardwareRate]);

    const handleSave = async () => {
        if (!staffId) { 
            setMessage('Error: Please select a staff member.'); 
            return; 
        }
        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetch('/api/commissions/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: parseInt(staffId),
                    category,
                    totalProfit: calculations.totalProfit,
                    commissionRate: calculations.commissionRate,
                    commissionEarned: calculations.commissionEarned,
                    notes,
                    items: calculations.itemsWithTotals,
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'An unknown error occurred');
            setMessage(result.message);
            setItems([{ id: Date.now(), quantity: 1, itemName: '', description: '', purchasingPrice: 0, sellingPrice: 0 }]);
            setNotes('');
        } catch (err) { // FIX 3: Removed ': any'
            // Safely handle the error message
            if (err instanceof Error) {
                setMessage(`Error: ${err.message}`);
            } else {
                setMessage('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="category-select" className="block text-sm font-medium text-gray-700">Commission Category</label>
                    {/* FIX 4: Removed 'as any' and used the specific type */}
                    <select id="category-select" value={category} onChange={e => setCategory(e.target.value as CommissionCategory)} className="mt-1 w-full rounded-md border-gray-300 text-gray-900 shadow-sm">
                        <option>Software</option>
                        <option>Hardware</option>
                    </select>
                </div>
                {/* ... rest of your JSX remains the same ... */}
                <div>
                    <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700">Assign to Staff</label>
                    <select id="staff-select" value={staffId} onChange={e => setStaffId(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 text-gray-900 shadow-sm">
                        {staffList.map(staff => <option key={staff.id} value={staff.id}>{staff.full_name}</option>)}
                    </select>
                </div>
                {category === 'Hardware' && (
                    <div>
                        <label htmlFor="hardware-rate" className="block text-sm font-medium text-gray-700">Hardware Rate (%)</label>
                        <input type="number" id="hardware-rate" value={hardwareRate} onChange={e => setHardwareRate(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-md border-gray-300 text-gray-900 shadow-sm" />
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500">
                        <tr>
                            <th className="p-2 w-20 text-right">Qty</th>
                            <th className="p-2 w-1/4">Item</th>
                            <th className="p-2 w-1/3">Description</th>
                            <th className="p-2 text-right">Purchasing Price</th>
                            <th className="p-2 text-right">Selling Price</th>
                            <th className="p-2 text-right">Total Profit</th>
                            <th className="p-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculations.itemsWithTotals.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full p-1 rounded-md border-2 border-gray-300 text-gray-900 text-right"/></td>
                                <td><input type="text" value={item.itemName} onChange={e => handleItemChange(item.id, 'itemName', e.target.value)} className="w-full p-1 rounded-md border-2 border-gray-300 text-gray-900"/></td>
                                <td><input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full p-1 rounded-md border-2 border-gray-300 text-gray-900"/></td>
                                <td><input type="number" value={item.purchasingPrice} onChange={e => handleItemChange(item.id, 'purchasingPrice', parseFloat(e.target.value) || 0)} className="w-full p-1 rounded-md border-2 border-gray-300 text-gray-900 text-right"/></td>
                                <td><input type="number" value={item.sellingPrice} onChange={e => handleItemChange(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)} className="w-full p-1 rounded-md border-2 border-gray-300 text-gray-900 text-right"/></td>
                                <td className="p-2 font-medium text-right whitespace-nowrap text-gray-900">N$ {formatCurrency(item.lineTotal)}</td>
                                <td>
                                    {items.length > 1 && (
                                        <button onClick={() => removeRow(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <button onClick={addRow} className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"><PlusCircle size={16}/> Add Item</button>
            </div>
            
            <div>
                 <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                 <textarea name="notes" id="notes" rows={3} onChange={e => setNotes(e.target.value)} value={notes} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"></textarea>
            </div>

            <div className="mt-6 p-4 bg-gray-100 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                 <div className="text-lg text-gray-900">Total Profit: <span className="font-bold">N$ {formatCurrency(calculations.totalProfit)}</span></div>
                 <div className="text-lg text-gray-900">Commission ({calculations.commissionRate * 100}%): <span className="font-bold text-green-600 text-xl">N$ {formatCurrency(calculations.commissionEarned)}</span></div>
                 <button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto justify-self-end py-2 px-6 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
                     {isLoading ? 'Saving...' : 'Save Record'}
                 </button>
            </div>
            {message && <p className={`mt-2 text-sm text-center ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        </div>
    );
}