// app/dashboard/profile/page.tsx

import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";
import Image from 'next/image';
import { User, Mail, Phone, Briefcase, Fingerprint } from "lucide-react";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm"; // 1. Import the new component

// Define the shape of the full user profile
interface UserProfile extends RowDataPacket {
  id: number;
  title: string;
  full_name: string;
  email: string;
  phone_number: string;
  job_title: string;
  department: string;
  social_security_code: string;
  id_number: string;
  postal_address: string;
  profile_image_url: string | null;
  role_name: string;
}

// Data fetching function for the current user's complete profile
async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const query = `SELECT s.*, r.name as role_name FROM staff s LEFT JOIN staff_role sr ON s.id = sr.staff_id LEFT JOIN roles r ON sr.role_id = r.id WHERE s.id = ?;`;
  const [results] = await db.query<RowDataPacket[]>(query, [userId]);
  return (results[0] as UserProfile) || null;
}

// A small helper component for displaying each detail item
const ProfileDetail = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => (
  <div className="flex items-start py-4">
    <Icon className="h-6 w-6 text-gray-500 mr-4 mt-1" />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
  </div>
);


export default async function MyProfilePage() {
  const session = await getSessionUser(); // Corrected: getSessionUser is synchronous
  if (!session) redirect('/login');

  const user = await getUserProfile(session.userId);

  if (!user) {
    return <p className="p-8">Could not load user profile.</p>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Your personal and company information.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="p-8 bg-gray-50 border-b flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <Image
            src={user.profile_image_url || '/default-profile.png'}
            alt="Profile Picture"
            width={120} height={120}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{user.title} {user.full_name}</h2>
            <p className="text-lg text-gray-600">{user.job_title || 'No job title assigned'}</p>
            <span className="mt-2 inline-block px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">{user.department} Department</span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ProfileDetail icon={Mail} label="Email Address" value={user.email} />
            <ProfileDetail icon={Phone} label="Phone Number" value={user.phone_number} />
            <ProfileDetail icon={Fingerprint} label="ID Number" value={user.id_number} />
            <ProfileDetail icon={Fingerprint} label="Social Security Code" value={user.social_security_code} />
            <div className="md:col-span-2"><ProfileDetail icon={User} label="Postal Address" value={user.postal_address} /></div>
            <div className="md:col-span-2 pt-4 border-t mt-4"><ProfileDetail icon={Briefcase} label="System Role" value={user.role_name} /></div>
        </div>
      </div>

      {/* --- 2. ADD THE NEW COMPONENT AT THE BOTTOM --- */}
      <ChangePasswordForm />
    </>
  );
}