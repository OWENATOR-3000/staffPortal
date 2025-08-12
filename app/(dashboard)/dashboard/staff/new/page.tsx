// app/dashboard/staff/new/page.tsx
"use client";

import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RowDataPacket } from 'mysql2';
import { User, Key, Briefcase, UploadCloud, Phone, Fingerprint, AtSign, ArrowLeft, Calendar, DollarSign } from 'lucide-react';

const validatePasswordRules = (password: string) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});


// --- Reusable Helper Functions & Data ---

// Fetches roles from the API for the dropdown
async function fetchRoles(): Promise<RowDataPacket[]> {
    try {
        const res = await fetch('/api/roles');
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        return data.roles || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Static data for form dropdowns
const departments = ['NetSecOps', 'Software', 'Finance', 'Front Desk', 'HR', 'Supervisor', 'Technical'];
const titles = ['Mr', 'Ms', 'Mrs', 'Dr'];


// --- Reusable UI Components ---

// Reusable styled input component for consistency across the form
const FormInput = ({ id, label, icon: Icon, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                id={id}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 shadow-sm"
                {...props}
            />
        </div>
    </div>
);

// A simple styled container for form sections to reduce repetition
const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-4">{title}</h2>
        <div className="mt-6">
            {children}
        </div>
    </div>
);

// --- Main Page Component ---
export default function NewStaffPage() {
    // --- State Management ---
    const [roles, setRoles] = useState<RowDataPacket[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();
    const [password, setPassword] = useState('');
const passwordRules = validatePasswordRules(password);


    // --- Effects ---
    useEffect(() => {
        fetchRoles().then(setRoles);
    }, []);

    // --- Handlers ---
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setIsLoading(true);
  setError('');
  const formData = new FormData(event.currentTarget);

  // ✅ Append controlled password field
  formData.set('password', password);

  try {
    const response = await fetch('/api/staff/register', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to register.');
    router.push('/dashboard/staff');
    router.refresh();
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};


    // --- Render ---
    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard/staff" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Staff Management
                </Link>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Add New Employee</h1>
                <p className="text-gray-600">Create a profile for a new staff member.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* === LEFT COLUMN === */}
                    <div className="lg:col-span-2 space-y-8">
                        <FormSection title="Personal & Contact Information">
                            <div className="space-y-6">
                                {/* Name Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
                                    <div className="sm:col-span-1">
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                        <select name="title" id="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                            {titles.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <FormInput id="firstName" name="firstName" label="First Name" type="text" required icon={User} />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <FormInput id="lastName" name="lastName" label="Last Name" type="text" required icon={User} />
                                    </div>
                                </div>
                                
                                {/* Phone Numbers Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormInput 
                                        id="primaryPhoneNumber" 
                                        name="primaryPhoneNumber" 
                                        label="Primary Phone" 
                                        type="tel" 
                                        icon={Phone} 
                                        placeholder="e.g., +264 81..." 
                                        required 
                                    />
                                    <FormInput 
                                        id="secondaryPhoneNumber" 
                                        name="secondaryPhoneNumber" 
                                        label="Secondary Phone" 
                                        type="tel" 
                                        icon={Phone} 
                                        placeholder="(Optional)" 
                                    />
                                    <FormInput 
                                        id="emergencyPhoneNumber" 
                                        name="emergencyPhoneNumber" 
                                        label="Emergency Contact" 
                                        type="tel" 
                                        icon={Phone} 
                                        placeholder="Number" 
                                        required 
                                    />
                                </div>

                                {/* Postal Address */}
                                <div>
                                    <label htmlFor="postalAddress" className="block text-sm font-medium text-gray-700">Postal Address</label>
                                    <textarea name="postalAddress" id="postalAddress" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"></textarea>
                                </div>

                                {/* Identification Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <FormInput id="ssn" name="ssn" label="Social Security Code" type="text" maxLength={8} icon={Fingerprint} />
                                    <FormInput id="idNumber" name="idNumber" label="ID Number" type="text" maxLength={11} icon={Fingerprint} />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Account Details">
                            <div className="space-y-6">
                                <FormInput id="email" name="email" label="Email Address" type="email" required icon={AtSign} />
                                <FormInput
  id="password"
  name="password"
  label="New Password (optional)"
  type="password"
  icon={Key}
  placeholder="Leave blank to keep current password"
  value={password}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
/>
{password && (
  <ul className="mt-2 text-sm text-gray-600 space-y-1 pl-2">
    <li className={passwordRules.length ? 'text-green-600' : 'text-red-500'}>
      {passwordRules.length ? '✓' : '✗'} At least 8 characters
    </li>
    <li className={passwordRules.uppercase ? 'text-green-600' : 'text-red-500'}>
      {passwordRules.uppercase ? '✓' : '✗'} At least one uppercase letter
    </li>
    <li className={passwordRules.lowercase ? 'text-green-600' : 'text-red-500'}>
      {passwordRules.lowercase ? '✓' : '✗'} At least one lowercase letter
    </li>
    <li className={passwordRules.number ? 'text-green-600' : 'text-red-500'}>
      {passwordRules.number ? '✓' : '✗'} At least one number
    </li>
    <li className={passwordRules.symbol ? 'text-green-600' : 'text-red-500'}>
      {passwordRules.symbol ? '✓' : '✗'} At least one special character (!@#$ etc.)
    </li>
  </ul>
)}


                            </div>
                        </FormSection>
                    </div>

                    {/* === RIGHT COLUMN === */}
                    <div className="space-y-8">
                        <FormSection title="Company Role">
                            <div className="space-y-6">
                                    <FormInput
      id="startDate"
      name="startDate"
      label="Start Date"
      type="date"
      required
      icon={Calendar}
    />

            <FormInput
            id="monthlySalary"
            name="monthlySalary" // This name MUST match what the API expects
            label="Monthly Salary (N$)"
            type="number"
            icon={DollarSign} // Using the new icon
            placeholder="e.g., 5000.00"
            step="0.01" // Allows for cents
            min="0"
        />
                                <FormInput id="jobTitle" name="jobTitle" label="Job Title" type="text" icon={Briefcase} />
                                <div>
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                                    <select name="department" id="department" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">System Role (Permissions)</label>
                                    <select name="roleId" id="roleId" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                        {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Profile Picture">
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <Image src={imagePreview} alt="Profile preview" width={128} height={128} className="mx-auto h-32 w-32 rounded-full object-cover"/>
                                    ) : (
                                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    )}
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label htmlFor="profilePicture" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                                            <span>Upload a file</span>
                                            <input id="profilePicture" name="profilePicture" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            </div>
                        </FormSection>
                    </div>
                </div>

                {/* === FORM ACTIONS === */}
                {error && <p className="mt-6 text-sm text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                <div className="mt-8 flex justify-end space-x-4">
                    <Link href="/dashboard/staff" className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</Link>
                    <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-semibold text-sm">
                        {isLoading ? 'Registering...' : 'Register Employee'}
                    </button>
                </div>
            </form>
        </div>
    );
}