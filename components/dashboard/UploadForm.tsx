// components/dashboard/UploadForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm({ documentTypes }: { documentTypes: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category');
    
    if (!file) { setError('Please select a file to upload.'); return; }
    if (!category) { setError('Please select a document category.'); return; }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'File upload failed.');
      }
      
      setSuccess('File uploaded successfully!');
      // Reset the form by resetting the target element
      (e.target as HTMLFormElement).reset();
      setFile(null);
      router.refresh(); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">1. Select Document Type</label>
        <select 
          name="category" 
          id="category" 
          required
          className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a category...</option>
          {documentTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">2. Choose File to Upload</label>
        <input 
          type="file" 
          name="file"
          id="file"
          onChange={handleFileChange} 
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <div className="pt-2">
        <button type="submit" disabled={!file || isUploading} className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
      
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
    </form>
  );
}