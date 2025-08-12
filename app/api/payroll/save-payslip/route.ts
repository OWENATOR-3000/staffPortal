// app/api/payroll/save-payslip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) { return NextResponse.json({ message: 'Not authenticated' }, { status: 401 }); }

    const hasPermission = await userHasPermission(session.userId, 'manage_payroll_settings');
    if (!hasPermission) { return NextResponse.json({ message: 'Forbidden' }, { status: 403 }); }

    const body = await req.json();
    const { 
        staffId, payPeriodStart, payPeriodEnd, 
        totalHours, hourlyRate, totalPay 
    } = body;

    // Basic validation
    if (!staffId || !payPeriodStart || !payPeriodEnd || totalPay === undefined) {
        return NextResponse.json({ message: 'Missing required fields to save payslip.' }, { status: 400 });
    }

    try {
        const query = `
            INSERT INTO payroll_history 
                (staff_id, pay_period_start, pay_period_end, total_hours, hourly_rate_at_payment, total_pay)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(query, [staffId, payPeriodStart, payPeriodEnd, totalHours || 0, hourlyRate || 0, totalPay]);
        
        return NextResponse.json({ message: 'Payslip has been saved to history successfully!' }, { status: 201 });
    } catch (error) {
        console.error("Error saving payslip:", error);
        return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    }
}