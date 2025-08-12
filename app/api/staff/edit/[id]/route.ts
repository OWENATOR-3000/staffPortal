// File: app/api/staff/edit/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { eachDayOfInterval, isWeekend } from 'date-fns';
import { RowDataPacket } from 'mysql2';

function getWorkingDaysInMonth(date: Date): number {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = eachDayOfInterval({ start, end });
    return daysInMonth.filter(day => !isWeekend(day)).length;
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    // --- FIX FOR THE 'params should be awaited' WARNING ---
    await context;
    // ------------------------------------------------------

    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { id: staffId } = context.params;
    if (!staffId) {
        return NextResponse.json({ message: 'Staff ID is missing.' }, { status: 400 });
    }

    const formData = await req.formData();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        
        // --- FIX FOR THE "NOTHING HAPPENS" BUG ---
        // Get the start date from the form. If it's empty, fetch the existing one from the DB.
        let startDate = formData.get('startDate') as string;
        if (!startDate) {
            const [staff] = await connection.query<RowDataPacket[]>('SELECT start_date FROM staff WHERE id = ?', [staffId]);
            if (staff.length > 0 && staff[0].start_date) {
                // Ensure it's in YYYY-MM-DD format
                startDate = new Date(staff[0].start_date).toISOString().slice(0, 10);
            }
        }
        // -------------------------------------------

        const updateFields: string[] = [];
        const params: any[] = [];

        const addField = (field: string, value: any) => {
            if (value !== null && value !== undefined && value !== '') {
                updateFields.push(`${field} = ?`);
                params.push(value);
            }
        };

        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        addField('title', formData.get('title'));
        addField('first_name', firstName);
        addField('last_name', lastName);
        if (firstName && lastName) {
            addField('full_name', `${firstName} ${lastName}`);
        } else if (firstName) {
             const [currentLastName] = await connection.query<RowDataPacket[]>('SELECT last_name FROM staff WHERE id = ?', [staffId]);
             addField('full_name', `${firstName} ${currentLastName[0].last_name}`);
        } else if (lastName) {
             const [currentFirstName] = await connection.query<RowDataPacket[]>('SELECT first_name FROM staff WHERE id = ?', [staffId]);
             addField('full_name', `${currentFirstName[0].first_name} ${lastName}`);
        }

        addField('email', formData.get('email'));
        addField('primary_phone_number', formData.get('primaryPhoneNumber'));
        addField('secondary_phone_number', formData.get('secondaryPhoneNumber'));
        addField('emergency_phone_number', formData.get('emergencyPhoneNumber'));
        addField('postal_address', formData.get('postalAddress'));
        addField('social_security_code', formData.get('ssn'));
        addField('id_number', formData.get('idNumber'));
        addField('job_title', formData.get('jobTitle'));
        addField('department', formData.get('department'));
        addField('start_date', startDate); // Use the (potentially fetched) startDate

        const monthlySalaryStr = formData.get('monthlySalary') as string;
        if (monthlySalaryStr) {
            const monthlySalaryNum = parseFloat(monthlySalaryStr) || 0;
            let hourlyRate = 0;
            if (monthlySalaryNum > 0 && startDate) { // This check will now pass
                const workingDays = getWorkingDaysInMonth(new Date(startDate));
                if (workingDays > 0) {
                    hourlyRate = (monthlySalaryNum / workingDays) / 8;
                }
            }
            addField('monthly_salary', monthlySalaryNum);
            addField('hourly_rate', hourlyRate);
        }

        const password = formData.get('password') as string;
        if (password) {
            const hashedPassword = await hashPassword(password);
            addField('password_hash', hashedPassword);
        }

        const profilePicture = formData.get('profilePicture') as File | null;
        if (profilePicture && profilePicture.size > 0) {
            // ... your file upload logic ...
        }

        if (updateFields.length > 0) {
            const updateStaffQuery = `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`;
            const staffParams = [...params, staffId];
            await connection.query(updateStaffQuery, staffParams);
        }

        const roleId = formData.get('roleId') as string;
        if (roleId) {
             const updateRoleQuery = `INSERT INTO staff_role (staff_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`;
            await connection.query(updateRoleQuery, [staffId, roleId]);
        }

        await connection.commit();
        
        return NextResponse.json({ message: 'Employee updated successfully!' }, { status: 200 });

    } catch (error: any) {
        await connection.rollback();
        console.error("Staff update failed:", error);
        return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
    } finally {
        connection.release();
    }
}