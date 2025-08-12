// File: app/api/staff/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
// 1. ========= CORRECT THE IMPORT =========
import { eachDayOfInterval, isWeekend } from 'date-fns';

async function ensureProfileUploadDirExists() {
  const profileDir = path.join(process.cwd(), 'public', 'images', 'profiles');
  try {
    await stat(profileDir);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await mkdir(profileDir, { recursive: true });
    } else {
      throw error;
    }
  }
}

function getWorkingDaysInCurrentMonth(): number {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = eachDayOfInterval({ start, end });
    // Filter out weekend days by negating isWeekend
    return daysInMonth.filter(day => !isWeekend(day)).length;
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const formData = await req.formData();

  // Your field extraction logic is correct...
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

    const [existing] = await connection.query('SELECT id FROM staff WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      throw new Error('An employee with this email already exists.');
    }

    let profileImageUrl: string | null = null;
    if (profilePicture && profilePicture.size > 0) {
      // your image upload logic...
    }

    const monthlySalaryNum = parseFloat(monthlySalaryStr) || 0;
    let hourlyRate = 0;

    if (monthlySalaryNum > 0) {
        const workingDays = getWorkingDaysInCurrentMonth();
        if (workingDays > 0) {
            hourlyRate = (monthlySalaryNum / workingDays) / 8;
        }
    }

    const hashedPassword = await hashPassword(password);
    const startDate = new Date(startDateRaw);
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

    const newStaffId = (result as any).insertId;
    await connection.query('INSERT INTO staff_role (staff_id, role_id) VALUES (?, ?)', [newStaffId, roleId]);
    await connection.commit();
    return NextResponse.json({ message: 'Employee registered successfully!', staffId: newStaffId }, { status: 201 });

  } catch (error: any) {
    await connection.rollback();
    console.error("Registration failed:", error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// 2. ========= REMOVE THE BROKEN isWeekday FUNCTION =========