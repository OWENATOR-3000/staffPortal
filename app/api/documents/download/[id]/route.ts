// app/api/documents/download/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import path from 'path';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { RowDataPacket } from 'mysql2';

interface DocumentRecord extends RowDataPacket {
  staff_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
}

export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const documentId = params.id;
  if (!documentId) {
    return new NextResponse('Document ID is required', { status: 400 });
  }

  try {
    // 1. Fetch the document metadata from the database
    const [documents] = await db.query<DocumentRecord[]>(
      'SELECT staff_id, file_name, file_path, file_type FROM documents WHERE id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return new NextResponse('Document not found', { status: 404 });
    }
    const doc = documents[0];

    // 2. Security Check: Ensure the user is requesting their own document
    // (Or that they have permission to view all documents, which we can add later)
    if (doc.staff_id !== session.userId) {
      // Here you could also check for 'view_all_documents' permission for admins/HR
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 3. Check if the file actually exists on the filesystem
    try {
      await stat(doc.file_path);
    } catch (error) {
      console.error('File not found on disk:', doc.file_path);
      return new NextResponse('File not found on server', { status: 404 });
    }

    // 4. Read the file from the filesystem
    const fileBuffer = await readFile(doc.file_path);

    // 5. Create response headers to trigger a download
    const headers = new Headers();
    headers.append('Content-Disposition', `attachment; filename="${doc.file_name}"`);
    headers.append('Content-Type', doc.file_type);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}