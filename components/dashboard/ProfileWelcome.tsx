// components/dashboard/ProfileWelcome.tsx
import Image from 'next/image';

interface Props {
  userName: string;
  profileImageUrl: string | null;
}

export default function ProfileWelcome({ userName, profileImageUrl }: Props) {
  const profilePicSrc = profileImageUrl || '/defaulticon.png';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
      <Image
        src={profilePicSrc}
        alt={`${userName}'s profile picture`}
        width={120}
        height={120}
        className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
      />
      <h2 className="mt-4 text-2xl font-bold text-gray-800">
        Welcome back, {userName}!
      </h2>
      <p className="mt-1 text-gray-500">
        Here&apos;s your dashboard at a glance.
      </p>
    </div>
  );
}