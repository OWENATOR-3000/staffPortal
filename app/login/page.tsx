"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md shadow-2xl rounded-xl px-8 pt-6 pb-8 mb-4">
        <div className="text-center mb-8">
          <Image 
            src="/glogo.png"
            alt="Logo"
            width={80}
            height={80}
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Staff Portal Login</h1>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 🔐 Password with visibility toggle */}
        <div className="mb-6 relative">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow-sm appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? (
              // Eye Off
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.27-2.943-9.544-7a9.975 9.975 0 013.252-4.507M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3 3a3 3 0 01-3-3m0 0L3 3m18 18l-6-6" />
              </svg>
            ) : (
              // Eye On
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Logging In...' : 'Login & Clock In'}
          </button>
        </div>
      </form>

      <p className="text-center text-xs text-white/80">
        <Link href="/" className="hover:underline text-gray-900 text-sm font-bold mb-2">← Back to Home</Link>
      </p>
    </div>
  );
}
