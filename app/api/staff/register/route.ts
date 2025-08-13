// File: app/api/staff/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { mkdir, stat, writeFile } from 'fs/promises'; // writeFile is now needed
import path from 'path';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { eachDayOfInterval, isWeekend } from 'date-fns';
import { OkPacket, RowDataPacket } from 'mysql2/promise'; // Import OkPacket

// Helper function to ensure the profile upload directory exists
async function ensureProfileUploadDirExists() {
  const profileDir = path.join(process.cwd(), 'public', 'images', 'profiles');
  try {
    await stat(profileDir);
  } catch (e) { // FIX: Removed ': any'
    // This is a type guard to safely access properties on an unknown error
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
      await mkdir(profileDir, { recursive: true });
    } else {
      throw e;
    }
  }
}

// Helper to get working days in the month of a given date
function getWorkingDaysInMonthOf(date: Date): number {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = eachDayOfInterval({ start, end });
    return daysInMonth.filter(day => !isWeekend(day)).length;
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const formData = await req.formData();
  
  const title = formData.get('title') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const primaryPhoneNumber = formData.get('primaryPhoneNumber') as string;
  const secondaryPhoneNumber = formData.get('secondaryPhoneNumber') as string;
  const emergencyPhoneNumber = formData.get('emergencyPhoneNumber') as string;
  const jobTitle = formData.get('jobTitle') as string;
  const department = formData.get('department') as string;
  const roleId = formData.get('roleId') as string;
  const ssn = formData.get('ssn') as string;
  const idNumber = formData.get('idNumber') as string;
  const postalAddress = formData.get('postalAddress') as string;
  const startDateRaw = formData.get('startDate') as string;
  const profilePicture = formData.get('profilePicture') as File | null;
  const monthlySalaryStr = formData.get('monthlySalary') as string; 

  if (!firstName || !lastName || !email || !password || !roleId || !startDateRaw || !primaryPhoneNumber || !emergencyPhoneNumber) {
    return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // FIX: Use RowDataPacket[] for a strongly-typed check
    const [existing] = await connection.query<RowDataPacket[]>('SELECT id FROM staff WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('An employee with this email already exists.');
    }

    // FIX: Use 'const' as it's not reassigned. Initialize as null.
    let profileImageUrl: string | null = null;
    if (profilePicture && profilePicture.size > 0) {
      // FIX: Implement the file upload logic to remove unused var errors
      await ensureProfileUploadDirExists();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const uniqueFilename = `${uniqueSuffix}-${profilePicture.name.replace(/\s+/g, '-')}`;
      const filePath = path.join(process.cwd(), 'public', 'images', 'profiles', uniqueFilename);
      const bytes = await profilePicture.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      // Store the public URL, not the full filesystem path
      profileImageUrl = `/images/profiles/${uniqueFilename}`;
    }

    const monthlySalaryNum = parseFloat(monthlySalaryStr) || 0;
    const startDate = new Date(startDateRaw);
    let hourlyRate = 0;

    if (monthlySalaryNum > 0) {
        // Use the specific start date's month for calculation
        const workingDays = getWorkingDaysInMonthOf(startDate);
        if (workingDays > 0) {
            hourlyRate = (monthlySalaryNum / workingDays) / 8;
        }
    }

    const hashedPassword = await hashPassword(password);
    const formattedDate = startDate.toLocaleDateString('en-GB').split('/').join('');
    const employeeNumber = `${firstName[0].toUpperCase()}${formattedDate}${lastName[0].toUpperCase()}`;

    const [result] = await connection.query(
      `INSERT INTO staff (
        title, first_name, last_name, full_name, email, password_hash,
        primary_phone_number, secondary_phone_number, emergency_phone_number,
        job_title, department, profile_image_url,
        social_security_code, id_number, postal_address,
        start_date, employee_number, monthly_salary, hourly_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, firstName, lastName, `${firstName} ${lastName}`, email, hashedPassword,
        primaryPhoneNumber, secondaryPhoneNumber, emergencyPhoneNumber,
        jobTitle, department, profileImageUrl,
        ssn, idNumber, postalAddress,
        startDateRaw, employeeNumber,
        monthlySalaryNum, hourlyRate
      ]
    );

    // FIX: Use OkPacket for the insert result
    const newStaffId = (result as OkPacket).insertId;
    await connection.query('INSERT INTO staff_role (staff_id, role_id) VALUES (?, ?)', [newStaffId, roleId]);
    await connection.commit();
    
    return NextResponse.json({ message: 'Employee registered successfully!', staffId: newStaffId }, { status: 201 });

  } catch (error) { // FIX: Remove ': any' and use a type guard
    await connection.rollback();
    console.error("Registration failed:", error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message }, { status: 500 });
  } finally {
    connection.release();
  }
}