// app/dashboard/payroll/history/page.tsx

import db from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";

// Define the type for our payroll history records
interface PayrollRecord extends RowDataPacket {
  id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  total_hours: string;
  hourly_rate_at_payment: string;
  total_pay: string;
  payment_date: Date;
}

// Data fetching function to get a user's payroll history
async function getPayrollHistory(userId: number): Promise<PayrollRecord[]> {
  const query = `
    SELECT * FROM payroll_history
    WHERE staff_id = ?
    ORDER BY payment_date DESC;
  `;
  const [results] = await db.query<RowDataPacket[]>(query, [userId]);
  return results as PayrollRecord[];
}

// --- THE FIX IS HERE ---
// Change the locale from 'en-ZA' to 'en-US'
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD', // Temporarily use USD to get the '$' symbol
  minimumFractionDigits: 2,
});


export default async function PayrollHistoryPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }

  const history = await getPayrollHistory(session.userId);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Payroll History</h1>
        <p className="text-gray-600">A record of all your past payments.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Pay Period</th>
                <th scope="col" className="px-6 py-3">Total Hours</th>
                <th scope="col" className="px-6 py-3">Hourly Rate</th>
                <th scope="col" className="px-6 py-3">Total Pay</th>
                <th scope="col" className="px-6 py-3">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {record.pay_period_start.toLocaleDateString()} - {record.pay_period_end.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{parseFloat(record.total_hours).toFixed(2)}</td>
                    
                    {/* --- THE FIX IS ALSO APPLIED HERE --- */}
                    <td className="px-6 py-4">
                      {/* We replace the default dollar sign ($) with our desired N$ */}
                      {currencyFormatter.format(parseFloat(record.hourly_rate_at_payment)).replace('$', 'N$ ')}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {currencyFormatter.format(parseFloat(record.total_pay)).replace('$', 'N$ ')}
                    </td>

                    <td className="px-6 py-4">{record.payment_date.toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center px-6 py-12 text-gray-500">
                    No payroll history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}