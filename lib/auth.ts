// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db'; // Make sure to import the database connection
import { RowDataPacket } from 'mysql2';


const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-secret-for-development';

// Define the shape of our token payload
export interface JwtPayload {
  user: any;
  userId: number;
  role: string;
}

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createJwt = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

// --- NEW AND IMPROVED PERMISSION CHECKER ---
export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  // This single, powerful query checks for a permission from EITHER the user's roles
  // OR a direct user-to-permission link.
  const query = `
    SELECT 1 
    FROM permissions p
    WHERE p.name = ? AND (
      -- Check for permission via assigned roles
      EXISTS (
        SELECT 1
        FROM staff_role sr
        JOIN role_permission rp ON sr.role_id = rp.role_id
        WHERE sr.staff_id = ? AND rp.permission_id = p.id
      )
      -- OR check for a direct permission assignment
      OR EXISTS (
        SELECT 1
        FROM user_permission up
        WHERE up.staff_id = ? AND up.permission_id = p.id
      )
    )
    LIMIT 1;
  `;
  
  try {
    // We provide the userId twice because it's used in both subqueries
    const [results] = await db.query<RowDataPacket[]>(query, [permissionName, userId, userId]);
    return results.length > 0;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}

// --- ADD THIS NEW FUNCTION TO THE END OF lib/auth.ts ---

export async function createNotificationForApprovers(message: string, link: string) {
    try {
        // This query finds all users who have the 'approve_requests' permission,
        // either through their role or directly assigned.
        const findApproversQuery = `
            SELECT DISTINCT s.id as staff_id
            FROM staff s
            WHERE
            -- Check via role
            EXISTS (
                SELECT 1
                FROM staff_role sr
                JOIN role_permission rp ON sr.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE s.id = sr.staff_id AND p.name = 'approve_requests'
            ) OR
            -- Check via direct user permission
            EXISTS (
                SELECT 1
                FROM user_permission up
                JOIN permissions p ON up.permission_id = p.id
                WHERE s.id = up.staff_id AND p.name = 'approve_requests'
            );
        `;
        
        const [approvers] = await db.query<RowDataPacket[]>(findApproversQuery);

        const approverIds = approvers.map(a => a.staff_id);

        if (approverIds.length > 0) {
            const values = approverIds.map(id => [id, message, link]);
            await db.query(
                `INSERT INTO notifications (recipient_staff_id, message, link_url) VALUES ?`,
                [values]
            );
            console.log(`Created notifications for ${approverIds.length} approvers.`);
        }
    } catch (error) {
        console.error("Failed to create notifications:", error);
    }
}

// --- THIS IS THE NEW FUNCTION ---
export async function createNotificationForRequester(
  staffId: number, 
  message: string, 
  link: string
) {
  try {
    await db.query(
        `INSERT INTO notifications (recipient_staff_id, message, link_url) VALUES (?, ?, ?)`,
        [staffId, message, link]
    );
    console.log(`Created notification for staff ID: ${staffId}`);
  } catch (error) {
      console.error("Failed to create notification for requester:", error);
  }
}