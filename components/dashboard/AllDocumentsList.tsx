// components/dashboard/AllDocumentsList.tsx
"use client";

import { useState, useMemo } from 'react';
import { DocumentWithUser, StaffOption } from '@/app/(dashboard)/dashboard/documents/all/page';
import { Download, Paperclip } from 'lucide-react';

interface Props {
    initialDocuments: DocumentWithUser[];
    staffList: StaffOption[];
    categories: string[];
}

export default function AllDocumentsList({ initialDocuments, staffList, categories }: Props) {
    const [documents] = useState(initialDocuments);
    const [selectedStaff, setSelectedStaff] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const staffMatch = selectedStaff === 'all' || doc.staff_id.toString() === selectedStaff;
            const categoryMatch = selectedCategory === 'all' || doc.category === selectedCategory;
            return staffMatch && categoryMatch;
        });
    }, [documents, selectedStaff, selectedCategory]);

    return (
        <div>
            {/* Filter Section */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
                <div>
                    <label htmlFor="staff-filter" className="block text-sm font-medium text-gray-700">Filter by Staff</label>
                    <select id="staff-filter" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="mt-1 block border-2 w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900">
                        <option value="all">All Staff</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">Filter by Category</label>
                    <select id="category-filter" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="mt-1 block border-2 w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900">
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Document List */}
            <ul className="divide-y divide-gray-200">
                {filteredDocuments.length > 0 ? filteredDocuments.map(doc => (
                    <li key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center">
                            <Paperclip className="h-6 w-6 text-gray-500 mr-4" />
                            <div>
                                <p className="font-medium text-gray-900">{doc.file_name}</p>
                                <p className="text-sm text-gray-500">
                                    Uploaded by <span className="font-semibold">{doc.staff_name}</span> on {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                                <span className="mt-1 inline-block px-2 py-0.5 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">{doc.category}</span>
                            </div>
                        </div>
                        <a href={`/api/documents/download/${doc.id}`} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            <Download className="h-4 w-4 mr-2"/>
                            Download
                        </a>
                    </li>
                )) : (
                    <li className="p-8 text-center text-gray-500">No documents match the current filters.</li>
                )}
            </ul>
        </div>
    );
}