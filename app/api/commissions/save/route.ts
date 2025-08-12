// app/api/commissions/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { userHasPermission } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await userHasPermission(session.userId, 'manage_commissions');
    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { 
        staffId, category, totalProfit, commissionRate, 
        commissionEarned, notes, items 
    } = body;

    // Validation
    if (!staffId || !category || !totalProfit || !commissionRate || !commissionEarned || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ message: 'Missing required fields for saving commission.' }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert the parent commission record
        const [recordResult] = await connection.query(
            `INSERT INTO commission_records (staff_id, category, total_profit, commission_rate, commission_earned, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [staffId, category, totalProfit, commissionRate, commissionEarned, notes || null]
        );
        const newRecordId = (recordResult as any).insertId;

        // 2. Prepare and insert all the line items
        const itemValues = items.map(item => [
            newRecordId,
            item.quantity,
            item.itemName,
            item.description,
            item.unitPrice,
            item.sellingPrice,
            item.purchasingPrice,
            item.lineTotal
        ]);

        await connection.query(
            `INSERT INTO commission_items (commission_record_id, quantity, item_name, description, unit_price, selling_price, purchasing_price, line_total)
             VALUES ?`,
            [itemValues]
        );

        await connection.commit();
        return NextResponse.json({ message: `Commission record #${newRecordId} saved successfully!` }, { status: 201 });

    } catch (error) {
        await connection.rollback();
        console.error("Error saving commission:", error);
        return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    } finally {
        connection.release();
    }
}