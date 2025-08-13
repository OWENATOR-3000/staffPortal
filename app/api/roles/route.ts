// app/api/roles/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const [roles] = await db.query('SELECT id, name FROM roles ORDER BY name');
        return NextResponse.json({ roles });
    } catch {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}