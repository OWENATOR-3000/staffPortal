// app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
// 1. Import 'mkdir' and 'stat' for checking/creating directories
import { writeFile, mkdir, stat } from 'fs/promises'; 
import path from 'path';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';

// --- Helper function to ensure the upload directory exists ---
async function ensureUploadDirExists() {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    // Check if the directory exists
    await stat(uploadDir);
  } catch (error) { // The 'error' parameter is of type 'unknown' by default
    // This is a "type guard". We check if the error is a system error
    // with a 'code' property before trying to access it.
    if (error && typeof error === 'object' && 'code' in error) {
      // Now TypeScript knows 'error' is an object with a 'code' property.
      if (error.code === 'ENOENT') {
        console.log(`Upload directory not found. Creating it at: ${uploadDir}`);
        await mkdir(uploadDir, { recursive: true });
      } else {
        // Handle other potential system errors
        console.error("Error checking upload directory:", error);
        throw error; // Re-throw other errors
      }
    } else {
      // The error was not an object or didn't have a 'code' property
      // (e.g., if someone did `throw "a string"`).
      console.error("An unexpected, non-system error occurred:", error);
      throw error;
    }
  }
}


export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    // 1. Get the new 'category' field from the form data
    const category = data.get('category') as string;

    if (!file || !category) {
      return NextResponse.json({ message: 'A file and a category are required.' }, { status: 400 });
    }

    await ensureUploadDirExists();

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const uniqueFilename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(process.cwd(), 'uploads', uniqueFilename);
    
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 2. Update the INSERT query to include the 'category'
    const query = `
      INSERT INTO documents (staff_id, file_name, file_path, file_type, file_size, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(query, [
      session.userId,
      file.name,
      filePath,
      file.type,
      file.size,
      category // Pass the category from the form
    ]);

    return NextResponse.json({ message: 'File uploaded successfully.' }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}