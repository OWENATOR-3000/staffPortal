// components/dashboard/PayslipGenerator.tsx
"use client";

import { useState, useEffect } from 'react';

// --- Type Definitions ---

// Define the shape of each section
interface PayslipSection {
    [key: string]: number; // Allows for dynamic keys like 'basic', 'bonus', etc.
}

// The main interface for the entire payslip data structure
interface PayslipData {
    name: string;
    surname: string;
    ssc_code: string;
    loanType: string;
    earnings: PayslipSection;
    deductions: PayslipSection;
    summary: {
        totalEarnings: number;
        totalDeductions: number;
        grossIncome: number;
        netIncome: number;
    };
}

// Reusable component for editable number fields
const PayslipInput = ({ value, onUpdate }: { value: number; onUpdate: (newValue: number) => void; }) => (
    <input 
        type="number"
        value={value.toFixed(2)}
        onChange={(e) => onUpdate(parseFloat(e.target.value) || 0)}
        className="w-full text-right px-2 py-1 bg-white rounded-md border-gray-300 text-sm text-gray-900 focus:ring-1 focus:ring-blue-500"
    />
);

// Reusable component for read-only value displays
const ReadOnlyDisplay = ({ value }: { value: number }) => (
    <div className="w-full text-right px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-700">
        {value.toFixed(2)}
    </div>
);


export default function PayslipGenerator({ staffList }: { staffList: { id: number, full_name: string }[] }) {
    const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id.toString() || '');
    const [payPeriodEnd, setPayPeriodEnd] = useState('');
    // FIX 1: Use our specific PayslipData interface. It can be null initially.
    const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!selectedStaffId || !payPeriodEnd) {
                setPayslipData(null);
                return;
            }
            setIsLoading(true);
            setError('');
            setSaveMessage('');
            try {
                const res = await fetch(`/api/payroll/initial-data?staffId=${selectedStaffId}&endDate=${payPeriodEnd}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                const totalEarnings = Object.values<number>(data.earnings).reduce((a, b) => a + b, 0);
                const totalDeductions = Object.values<number>(data.deductions).reduce((a, b) => a + b, 0);
                
                // The object being set now conforms to the PayslipData interface
                setPayslipData({
                    ...data,
                    earnings: data.earnings,
                    deductions: data.deductions,
                    summary: {
                        totalEarnings, totalDeductions,
                        grossIncome: totalEarnings,
                        netIncome: totalEarnings - totalDeductions
                    }
                });
            } catch (err) { // FIX 2: Removed ': any'
                // Safely handle the error
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred while fetching data.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [selectedStaffId, payPeriodEnd]);
    
    const handleUpdate = (section: 'earnings' | 'deductions', key: string, value: number) => {
        // FIX 3: Type 'prev' as 'PayslipData | null'
        setPayslipData((prev: PayslipData | null) => {
            if (!prev) return null; // Guard against null state
            
            // Create a deep copy to avoid direct state mutation
            const newData = JSON.parse(JSON.stringify(prev));
            
            newData[section][key] = value;
            
            const totalEarnings = Object.values<number>(newData.earnings).reduce((sum, val) => sum + val, 0);
            const totalDeductions = Object.values<number>(newData.deductions).reduce((sum, val) => sum + val, 0);
            
            newData.summary = { 
                totalEarnings, 
                totalDeductions, 
                grossIncome: totalEarnings, 
                netIncome: totalEarnings - totalDeductions 
            };
            
            return newData;
        });
    };

    const handleSave = async () => {
        if (!payslipData) return;
        setSaveMessage('Saving...');
        try {
            const payPeriodStart = `${payPeriodEnd.substring(0, 8)}01`;
            const response = await fetch('/api/payroll/save-payslip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: selectedStaffId,
                    payPeriodStart, payPeriodEnd,
                    totalPay: payslipData.summary.netIncome,
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setSaveMessage(result.message);
        } catch (err) { // FIX 4: Removed ': any'
            // Safely handle the error
            if (err instanceof Error) {
                setSaveMessage(`Error: ${err.message}`);
            } else {
                setSaveMessage('An unknown error occurred during save.');
            }
        }
    };

    const formatCurrency = (amount: number) => `N$ ${amount.toFixed(2)}`;

    // The rest of your JSX remains the same and will work correctly
    // with the new typed 'payslipData' state.
    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700">Employee</label>
                    <select id="staff-select" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="mt-1 block w-full rounded-md text-gray-900 border-gray-300">
                        <option value="">Select Employee</option>
                        {staffList.map(staff => (<option key={staff.id} value={staff.id}>{staff.full_name}</option>))}
                    </select>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Pay Period End Date</label>
                    <input type="date" id="end-date" value={payPeriodEnd} onChange={e => setPayPeriodEnd(e.target.value)} className="mt-1 block w-full rounded-md text-gray-900 border-gray-300"/>
                </div>
            </div>
            
            {isLoading && <p className="text-center p-4 animate-pulse">Generating initial data...</p>}
            {error && <p className="text-center text-red-600">{error}</p>}

            {payslipData && (
                <div className="p-6 border rounded-lg animate-fade-in">
                    <div className="border p-2 mb-4 text-gray-700"><p><strong>Name:</strong> {payslipData.name} {payslipData.surname}</p></div>
                    <div className="grid grid-cols-12 gap-px bg-gray-200 border">
                        <div className="col-span-5 bg-gray-100 p-2 font-bold text-gray-700">Description</div>
                        <div className="col-span-3 bg-gray-100 p-2 font-bold text-center text-gray-700">Earning</div>
                        <div className="col-span-4 bg-gray-100 p-2 font-bold text-center text-gray-700">Deductions</div>

                        {/* Earning Rows */}
                        <div className="col-span-5 bg-white p-2 text-gray-700">Basic Hours</div>
                        <div className="col-span-3 bg-white p-1 border-l"><ReadOnlyDisplay value={payslipData.earnings.basic} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>

                        <div className="col-span-5 bg-white p-2 text-gray-700">Normal Overtime</div>
                        <div className="col-span-3 bg-white p-1 border-l"><ReadOnlyDisplay value={payslipData.earnings.normalOvertime} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>
                        
                        <div className="col-span-5 bg-white p-2 text-gray-700">Sunday Overtime</div>
                        <div className="col-span-3 bg-white p-1 border-l"><ReadOnlyDisplay value={payslipData.earnings.sundayOvertime} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>

                        <div className="col-span-5 bg-white p-2 text-gray-700">Bonus</div>
                        <div className="col-span-3 bg-white p-1 border-l"><PayslipInput value={payslipData.earnings.bonus} onUpdate={(v) => handleUpdate('earnings', 'bonus', v)} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>

                        <div className="col-span-5 bg-white p-2 text-gray-700">Housing Allowance</div>
                        <div className="col-span-3 bg-white p-1 border-l"><PayslipInput value={payslipData.earnings.housing} onUpdate={(v) => handleUpdate('earnings', 'housing', v)} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>

                        <div className="col-span-5 bg-white p-2 text-gray-700">Medical Allowance</div>
                        <div className="col-span-3 bg-white p-1 border-l"><PayslipInput value={payslipData.earnings.medical} onUpdate={(v) => handleUpdate('earnings', 'medical', v)} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>

                        <div className="col-span-5 bg-white p-2 text-gray-700">Other Allowance</div>
                        <div className="col-span-3 bg-white p-1 border-l"><PayslipInput value={payslipData.earnings.other} onUpdate={(v) => handleUpdate('earnings', 'other', v)} /></div>
                        <div className="col-span-4 bg-white p-1 border-l"></div>

                        {/* Deduction Rows */}
                        <div className="col-span-5 bg-white p-2 text-gray-700">Salary Advance</div>
                        <div className="col-span-3 bg-white p-1 border-l"></div>
                        <div className="col-span-4 bg-white p-1 border-l"><PayslipInput value={payslipData.deductions.advance} onUpdate={(v) => handleUpdate('deductions', 'advance', v)} /></div>

                        <div className="col-span-5 bg-white p-1 flex items-center space-x-2">
                            <span className="text-gray-700">Loans</span>
                            <input type="text" readOnly value={payslipData.loanType} className="flex-grow p-1 text-xs bg-gray-100 rounded-md border-gray-300 text-gray-600"/>
                        </div>
                        <div className="col-span-3 bg-white p-1 border-l"></div>
                        <div className="col-span-4 bg-white p-1 border-l"><PayslipInput value={payslipData.deductions.loan} onUpdate={(v) => handleUpdate('deductions', 'loan', v)} /></div>

                       <div className="col-span-5 bg-white p-1 flex items-center space-x-2">
                            <span className="text-gray-700">SSC</span>
                            <input type="text" readOnly value={payslipData.ssc_code} className="flex-grow p-1 text-xs bg-gray-100 rounded-md border-gray-300 text-gray-600"/>
                        </div>
                        <div className="col-span-3 bg-white p-1 border-l"></div>
                        <div className="col-span-4 bg-white p-1 border-l">
                        </div>
                        <div className="col-span-5 bg-white p-2 text-gray-700">Income Tax</div>
                        <div className="col-span-3 bg-white p-1 border-l"></div>
                        <div className="col-span-4 bg-white p-1 border-l"><PayslipInput value={payslipData.deductions.tax} onUpdate={(v) => handleUpdate('deductions', 'tax', v)} /></div>

                        {/* Summary Section */}
                        <div className="col-span-5 bg-gray-50 p-2 text-right font-bold text-gray-700">Total Earnings</div>
                        <div className="col-span-3 bg-gray-50 p-2 font-bold text-right text-gray-700">{formatCurrency(payslipData.summary.totalEarnings)}</div>
                        <div className="col-span-4 bg-white p-1"></div>
                        
                        <div className="col-span-5 bg-gray-50 p-2 text-right font-bold text-gray-700">Total Deductions</div>
                        <div className="col-span-3 bg-white p-1"></div>
                        <div className="col-span-4 bg-gray-50 p-2 font-bold text-right text-gray-700">{formatCurrency(payslipData.summary.totalDeductions)}</div>

                        <div className="col-span-8 bg-gray-100 p-2 text-right font-bold text-gray-700">GROSS INCOME</div>
                        <div className="col-span-4 bg-gray-100 p-2 font-bold text-right text-gray-700">{formatCurrency(payslipData.summary.grossIncome)}</div>

                        <div className="col-span-8 bg-gray-100 p-2 text-right font-bold text-lg text-gray-700">NET INCOME</div>
                        <div className="col-span-4 bg-gray-100 p-2 font-bold text-right text-lg text-green-600">{formatCurrency(payslipData.summary.netIncome)}</div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button className="px-4 py-2 bg-gray-300 rounded-md text-gray-700">Preview</button>
                        <button className="px-4 py-2 bg-gray-300 rounded-md text-gray-700">Download</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Final Payslip</button>
                    </div>
                    {saveMessage && <p className="text-right mt-2 text-sm">{saveMessage}</p>}
                </div>
            )}
        </div>
    );
}