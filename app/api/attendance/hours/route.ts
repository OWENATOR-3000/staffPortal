// app/api/attendance/hours/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staffId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!staffId || !startDate || !endDate) {
    return NextResponse.json({ message: 'staffId, startDate, and endDate are required.' }, { status: 400 });
  }

  try {
    const query = `
      WITH PairedEvents AS (
          SELECT
              staff_id,
              event_time AS clock_in_time,
              LEAD(event_time, 1) OVER (PARTITION BY staff_id ORDER BY event_time) AS next_event_time,
              LEAD(event_type, 1) OVER (PARTITION BY staff_id ORDER BY event_time) AS next_event_type
          FROM attendance_log
          WHERE staff_id = ? AND DATE(event_time) BETWEEN ? AND ?
      )
      SELECT
          -- Sum the difference in seconds only for valid clock_in -> clock_out pairs
          COALESCE(SUM(TIMESTAMPDIFF(SECOND, clock_in_time, next_event_time)), 0) AS total_seconds
      FROM PairedEvents
      WHERE
          next_event_type = 'clock_out';
    `;
    
    const [results] = await db.query<RowDataPacket[]>(query, [staffId, startDate, endDate]);
    const totalSeconds = results[0]?.total_seconds || 0;
    const totalHours = totalSeconds / 3600;

    return NextResponse.json({ totalHours: totalHours.toFixed(2) });

  } catch (error) {
    console.error("Error fetching attendance hours:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}