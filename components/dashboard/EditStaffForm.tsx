// components/dashboard/EditStaffForm.tsx
"use client";

import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RowDataPacket } from 'mysql2';
import { User, Key, Briefcase, UploadCloud, Phone, Fingerprint, AtSign, Calendar, Hash, DollarSign } from 'lucide-react'; // Added Calendar, Hash



const validatePasswordRules = (password: string) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

// --- Type Imports ---
interface Staff extends RowDataPacket {
    id: number;
    title: string | null;
    first_name: string | null;
    last_name: string | null;
    primary_phone_number: string | null;
    secondary_phone_number: string | null;
    emergency_phone_number: string | null;
    postal_address: string | null;
    social_security_code: string | null;
    id_number: string | null;
    email: string;
    job_title: string | null;
    department: string | null;
    role_id: number | null;
    profile_image_url: string | null;
    // ADDED
    start_date: string | null;
    employee_number: string | null;
}
interface Role extends RowDataPacket {
    id: number;
    name: string;
}

// --- Data ---
const departments = ['NetSecOps', 'Software', 'Finance', 'Front Desk', 'HR', 'Supervisor', 'Technical'];
const titles = ['Mr', 'Ms', 'Mrs', 'Dr'];

// --- Reusable UI Components ---
const FormInput = ({ id, label, icon: Icon, ...props }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Icon className="h-5 w-5 text-gray-400" /></div>
            <input id={id} className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 shadow-sm read-only:bg-gray-100 read-only:cursor-not-allowed" {...props} />
        </div>
    </div>
);
const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md"><h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-4">{title}</h2><div className="mt-6">{children}</div></div>
);

// --- Main Form Component ---
interface EditStaffFormProps {
    staff: Staff;
    roles: Role[];
}

export default function EditStaffForm({ staff, roles }: EditStaffFormProps) {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();
    const [password, setPassword] = useState('');
const passwordRules = validatePasswordRules(password);


    useEffect(() => {
        if (staff?.profile_image_url) {
            setImagePreview(staff.profile_image_url);
        }
    }, [staff]);

    // ... (handleFileChange and handleSubmit are unchanged) ...
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData(event.currentTarget);
        try {
            const response = await fetch(`/api/staff/edit/${staff.id}`, { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update profile.');
            router.push('/dashboard/staff');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


    if (!staff) {
        return <div className="text-center p-8">Loading form...</div>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* === LEFT COLUMN === */}
                <div className="lg:col-span-2 space-y-8">
                    {/* ... (Personal & Contact Info section is unchanged) ... */}
                    <FormSection title="Personal & Contact Information">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
                                <div className="sm:col-span-1">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                                    <select name="title" id="title" defaultValue={staff.title || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                        {titles.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2"><FormInput id="firstName" name="firstName" label="First Name" type="text"  icon={User} defaultValue={staff.first_name || ''} /></div>
                                <div className="sm:col-span-3"><FormInput id="lastName" name="lastName" label="Last Name" type="text"  icon={User} defaultValue={staff.last_name || ''} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormInput id="primaryPhoneNumber" name="primaryPhoneNumber" label="Primary Phone" type="tel" icon={Phone} defaultValue={staff.primary_phone_number || ''} />
                                <FormInput id="secondaryPhoneNumber" name="secondaryPhoneNumber" label="Secondary Phone" type="tel" icon={Phone} defaultValue={staff.secondary_phone_number || ''} />
                                <FormInput id="emergencyPhoneNumber" name="emergencyPhoneNumber" label="Emergency Contact" type="tel" icon={Phone} defaultValue={staff.emergency_phone_number || ''}  />
                            </div>
                            <div>
                                <label htmlFor="postalAddress" className="block text-sm font-medium text-gray-700">Postal Address</label>
                                <textarea name="postalAddress" id="postalAddress" rows={3} defaultValue={staff.postal_address || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"></textarea>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormInput id="ssn" name="ssn" label="Social Security Code" type="text" icon={Fingerprint} defaultValue={staff.social_security_code || ''} />
                                <FormInput id="idNumber" name="idNumber" label="ID Number" type="text" icon={Fingerprint} defaultValue={staff.id_number || ''} />
                            </div>
                        </div>
                    </FormSection>
                    {/* ... (Account Details section is unchanged) ... */}
                    <FormSection title="Account Details">
                        <div className="space-y-6">
                            <FormInput id="email" name="email" label="Email Address" type="email"  icon={AtSign} defaultValue={staff.email || ''} />
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
                            {/* THIS IS THE NEWLY ADDED PART */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                 <div className="sm:col-span-2">
    <FormInput
      id="startDate"
      name="startDate"
      label="Start Date"
      type="date"
     
      icon={Calendar}
      defaultValue={
  staff.start_date
    ? typeof staff.start_date === 'string'
      ? staff.start_date.slice(0, 10)
      : new Date(staff.start_date).toISOString().slice(0, 10)
    : ''
}

    />
  </div>
   <div className="sm:col-span-2 text-sm text-gray-500">
                                <FormInput
                                    id="employeeNumber"
                                    name="employeeNumber"
                                    label="Employee Number"
                                    type="text"
                                    icon={Hash}
                                    readOnly
                                    defaultValue={staff.employee_number || ''}
                                />
                                </div>
                            </div>
                                                        <FormInput
                                id="monthlySalary"
                                name="monthlySalary" // Must match the name expected by the API
                                label="Monthly Salary (N$)"
                                type="number"
                                icon={DollarSign}
                                placeholder="e.g., 5000.00"
                                step="0.01"
                                min="0"
                                defaultValue={staff.monthly_salary || ''}
                            />
                             {/* END OF NEWLY ADDED PART */}

                            <FormInput id="jobTitle" name="jobTitle" label="Job Title" type="text" icon={Briefcase} defaultValue={staff.job_title || ''} />
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                                <select name="department" id="department"  defaultValue={staff.department || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">System Role (Permissions)</label>
                                <select name="roleId" id="roleId"  defaultValue={staff.role_id || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </FormSection>
                    {/* ... (Profile Picture section is unchanged) ... */}
                     <FormSection title="Profile Picture">
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {imagePreview ? <Image src={imagePreview} alt="Profile preview" width={128} height={128} className="mx-auto h-32 w-32 rounded-full object-cover"/> : <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />}
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label htmlFor="profilePicture" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"><span>Change picture</span><input id="profilePicture" name="profilePicture" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" /></label>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    </FormSection>
                </div>
            </div>

            {/* === FORM ACTIONS === */}
            {/* ... (This section is unchanged) ... */}
            {error && <p className="mt-6 text-sm text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="mt-8 flex justify-end space-x-4">
                <Link href="/dashboard/staff" className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Cancel</Link>
                <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-semibold text-sm">
                    {isLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}