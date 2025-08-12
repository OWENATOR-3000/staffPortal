// components/dashboard/Header.tsx
"use client"; // 1. This component now needs to be a client component for state

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext'; // 2. Import useAuth to get the logout function
import { User as UserIcon, LogOut } from 'lucide-react'; // Import icons for the dropdown

interface User {
  fullName: string;
  email: string;
  profile_image_url?: string | null;
}

export default function Header({ user }: { user: User }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout } = useAuth(); // Get the logout function from our context
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref to detect clicks outside the dropdown

  const profilePicSrc = user.profile_image_url || '/defaulticon.png';

  // This hook handles closing the dropdown if the user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <header className="flex justify-between items-center p-4 bg-blue-900 text-white shadow-md">
      {/* Left side of the header */}
      <div className="flex items-center">
        <Image 
          src="/GMLogo.png" 
          alt="Staff Portal Logo" 
          width={40} 
          height={40} 
          className="mr-4"
        />
        <h1 className="text-xl font-bold">Staff Portal</h1>
      </div>

      {/* Right side of the header */}
      <div className="flex items-center">
        <div className="relative" ref={dropdownRef}>
            {/* This button now toggles the dropdown */}
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-white rounded-full"
            >
                <span className="mr-3 hidden md:inline">{user.fullName}</span>
                <Image 
                    src={profilePicSrc} 
                    alt="User Profile Picture" 
                    width={40} 
                    height={40} 
                    className="w-10 h-10 rounded-full object-cover" 
                />
            </button>

            {/* --- THE DROPDOWN MENU --- */}
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                        href="/dashboard/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)} // Close dropdown on navigate
                    >
                        <UserIcon className="mr-3 h-5 w-5 text-gray-500" />
                        My Profile
                    </Link>
                    <button
                        onClick={() => {
                            setIsDropdownOpen(false); // Close dropdown first
                            logout(); // Then call logout
                        }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                        Logout
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
}