// components/dashboard/PayrollCalculator.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RowDataPacket } from 'mysql2';

interface StaffMember extends RowDataPacket { id: number; full_name: string; hourly_rate: string; }

// Define the shape of the data we expect back from the new API
interface PayrollResult {
    baseHourlyRate: number;
    regularHours: string;
    normalOvertimeHours: string;
    sundayOvertimeHours: string;
    regularPay: string;
    normalOvertimePay: string;
    sundayOvertimePay: string;
    totalPay: string;
}

const ResultRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between py-2 border-b border-gray-200">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
    </div>
);


export default function PayrollCalculator({ staffList }: { staffList: StaffMember[] }) {
    const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id.toString() || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // State to hold the full result object from the API
    const [payrollResult, setPayrollResult] = useState<PayrollResult | null>(null);
    
    const router = useRouter();

    const handleCalculatePay = async () => {
        if (!selectedStaffId || !startDate || !endDate) {
            setError('Please select a staff member and a date range.');
            return;
        }
        setIsLoading(true);
        setError('');
        setPayrollResult(null);
        try {
            // Call the new, powerful API endpoint
            const response = await fetch(`/api/payroll/calculate?staffId=${selectedStaffId}&startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to calculate payroll.');
            }
            const data = await response.json();
            setPayrollResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Generate Payslip Calculation</h3>
            <p className="mt-1 text-sm text-gray-600">Select an employee and a pay period to generate a full breakdown of their earnings, including overtime.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                <div>
                    <label htmlFor="staff" className='text-gray-800'>Staff Member</label>
                    <select id="staff" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="mt-1 w-full rounded-md text-gray-900 border-2 border-gray-300">
                       {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>
                                {staff.full_name} (Rate: N$ {parseFloat(staff.hourly_rate).toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>
                <div><label htmlFor="start-date" className='text-gray-800'>Pay Period Start</label><input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border-2 border-gray-300 text-gray-700"/></div>
                <div><label htmlFor="end-date" className='text-gray-800'>Pay Period End</label><input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border-2 border-gray-300 text-gray-700"/></div>
            </div>

            <button onClick={handleCalculatePay} disabled={isLoading} className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Calculating...' : 'Generate Calculation'}
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {payrollResult && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-medium text-gray-900">Payslip Breakdown</h4>
                    <div className="mt-4 space-y-2">
                        <ResultRow label="Base Hourly Rate" value={`N$ ${payrollResult.baseHourlyRate.toFixed(2)}`} />
                        <hr className="my-2"/>
                        <ResultRow label="Regular Hours Worked" value={`${payrollResult.regularHours} hrs`} />
                        <ResultRow label="Normal Overtime Hours (1.5x)" value={`${payrollResult.normalOvertimeHours} hrs`} />
                        <ResultRow label="Sunday Overtime Hours (2.0x)" value={`${payrollResult.sundayOvertimeHours} hrs`} />
                         <hr className="my-2"/>
                        <ResultRow label="Regular Pay" value={`N$ ${payrollResult.regularPay}`} />
                        <ResultRow label="Normal Overtime Pay" value={`N$ ${payrollResult.normalOvertimePay}`} />
                        <ResultRow label="Sunday Overtime Pay" value={`N$ ${payrollResult.sundayOvertimePay}`} />
                         <hr className="my-2"/>
                        <div className="flex justify-between py-2 text-xl bg-gray-100 p-2 rounded-md">
                            <span className="font-bold text-gray-900">Total Gross Pay</span>
                            <span className="font-bold text-green-600">N$ {payrollResult.totalPay}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}