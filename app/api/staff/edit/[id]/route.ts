// File: app/api/staff/edit/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { eachDayOfInterval, isWeekend } from 'date-fns';
import { RowDataPacket } from 'mysql2/promise'; // Use from mysql2/promise

// Note: Unused 'writeFile' and 'path' imports have been removed.

// Helper function to calculate working days in a month
function getWorkingDaysInMonth(date: Date): number {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = eachDayOfInterval({ start, end });
    return daysInMonth.filter(day => !isWeekend(day)).length;
}

// Interfaces for our specific database queries
interface StaffStartDatePacket extends RowDataPacket {
    start_date: Date | string;
}
interface StaffNamePacket extends RowDataPacket {
    first_name: string;
    last_name: string;
}

export async function POST(req: NextRequest, { params: { id: staffId } }: { params: { id: string } }) {
    const session = await getSessionUser();
    if (!session) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    if (!staffId) {
        return NextResponse.json({ message: 'Staff ID is missing.' }, { status: 400 });
    }

    const formData = await req.formData();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        
        let startDate = formData.get('startDate') as string;
        if (!startDate) {
            const [staff] = await connection.query<StaffStartDatePacket[]>('SELECT start_date FROM staff WHERE id = ?', [staffId]);
            if (staff.length > 0 && staff[0].start_date) {
                startDate = new Date(staff[0].start_date).toISOString().slice(0, 10);
            }
        }
        
        // FIX: The params array is now strongly typed
        const updateFields: string[] = [];
        const params: (string | number | null)[] = [];

        // FIX: The 'value' parameter is now strongly typed
        const addField = (field: string, value: string | number | null | undefined) => {
            if (value !== null && value !== undefined && value !== '') {
                updateFields.push(`${field} = ?`);
                params.push(value);
            }
        };

        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        addField('title', formData.get('title') as string);
        addField('first_name', firstName);
        addField('last_name', lastName);

        if (firstName && lastName) {
            addField('full_name', `${firstName} ${lastName}`);
        } else if (firstName) {
             const [staffName] = await connection.query<StaffNamePacket[]>('SELECT last_name FROM staff WHERE id = ?', [staffId]);
             if (staffName[0]) addField('full_name', `${firstName} ${staffName[0].last_name}`);
        } else if (lastName) {
             const [staffName] = await connection.query<StaffNamePacket[]>('SELECT first_name FROM staff WHERE id = ?', [staffId]);
             if (staffName[0]) addField('full_name', `${staffName[0].first_name} ${lastName}`);
        }

        addField('email', formData.get('email') as string);
        addField('primary_phone_number', formData.get('primaryPhoneNumber') as string);
        addField('secondary_phone_number', formData.get('secondaryPhoneNumber') as string);
        addField('emergency_phone_number', formData.get('emergencyPhoneNumber') as string);
        addField('postal_address', formData.get('postalAddress') as string);
        addField('social_security_code', formData.get('ssn') as string);
        addField('id_number', formData.get('idNumber') as string);
        addField('job_title', formData.get('jobTitle') as string);
        addField('department', formData.get('department') as string);
        addField('start_date', startDate);

        const monthlySalaryStr = formData.get('monthlySalary') as string;
        if (monthlySalaryStr) {
            const monthlySalaryNum = parseFloat(monthlySalaryStr) || 0;
            let hourlyRate = 0;
            if (monthlySalaryNum > 0 && startDate) {
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
            // Your file upload logic would go here. Since it's commented out in the
            // original, I'm leaving it out for now to satisfy the "unused imports" rule.
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

    } catch (error) { // FIX: Removed ': any'
        await connection.rollback();
        console.error("Staff update failed:", error);
        // Safely get the error message
        const message = error instanceof Error ? error.message : 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    } finally {
        connection.release();
    }
}