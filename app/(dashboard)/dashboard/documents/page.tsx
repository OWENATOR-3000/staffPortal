// app/dashboard/documents/page.tsx
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { Paperclip, Download } from 'lucide-react';
import UploadForm from "@/components/dashboard/UploadForm";

// Update the interface to include the category
interface DocumentRecord extends RowDataPacket {
  id: number;
  file_name: string;
  file_size: number;
  uploaded_at: Date;
  category: string;
}

// Update the query to select the 'category' column
async function getUserDocuments(userId: number): Promise<DocumentRecord[]> {
  const [documents] = await db.query<RowDataPacket[]>(`
    SELECT id, file_name, file_size, uploaded_at, category 
    FROM documents 
    WHERE staff_id = ? 
    ORDER BY uploaded_at DESC
  `, [userId]);
  return documents as DocumentRecord[];
}

export default async function DocumentsPage() {
  const session = await getSessionUser(); // Corrected: getSessionUser is sync
  if (!session) redirect('/login');

  const documents = await getUserDocuments(session.userId);
  const documentTypes = ['CV / Resume', 'ID / Passport', 'Contract', 'Certificate', 'Report', 'Other'];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Documents</h1>
        <p className="text-gray-600">Upload and manage your personal documents.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Upload New Document</h2>
        {/* Pass the document types down to the form component */}
        <UploadForm documentTypes={documentTypes} />
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b"><h2 className="text-xl font-semibold text-gray-700">Uploaded Files</h2></div>
        <ul className="divide-y divide-gray-200">
          {documents.length > 0 ? documents.map(doc => (
            <li key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <Paperclip className="h-6 w-6 text-gray-500 mr-4" />
                <div>
                  <p className="font-medium text-gray-900">{doc.file_name}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {/* Display the category */}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{doc.category}</span>
                    <span>•</span>
                    <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <a href={`/api/documents/download/${doc.id}`} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2"/> Download
              </a>
            </li>
          )) : (
            <li className="p-8 text-center text-gray-500">No documents uploaded yet.</li>
          )}
        </ul>
      </div>
    </>
  );
}