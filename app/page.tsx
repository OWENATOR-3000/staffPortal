// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// A client-side component for the live clock
const LiveClock = () => {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date()); 
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="bg-white text-black p-4 rounded-lg shadow-xl text-center">
            <span className="text-5xl font-mono tracking-widest">
                {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '00:00:00'}
            </span>
        </div>
    );
};


export default function SplashScreen() {
    return (
        <main className="relative w-full h-screen overflow-hidden">
            {/* Floating GIF overlay */}
<div className="absolute left-[30%] top-[60%] z-20 transform -translate-x-1/2 -translate-y-1/2">
   
  <Image
    src="/gif.gif"
    alt="Animated people walking"
    width={5000}  // Adjust as needed
    height={5000}
    unoptimized
  />
</div>

            {/* 1. The full-screen background image - This is now the base layer */}
            <Image
                src="/background-lines.jpg" // Your background image file
                alt="Abstract background"
                fill
                className="object-cover z-0"
                priority
            />
            
            {/* Login Link - Top Right (on top of everything) */}
            <div className="absolute top-5 right-5 z-30">
                <Link href="/login" className="px-4 py-2 bg-white/20 text-white rounded-md backdrop-blur-sm hover:bg-white/30 transition">
                    Login
                </Link>
            </div>

            {/* Container for the two panels */}
            <div className="relative z-10 flex w-full h-full">

                {/* Left Side Panel (now just contains the logo and GIF) */}
                <div className="w-1/2 h-full p-10 flex flex-col justify-between">
                    {/* G-Mobility Logo */}
                    <div>
                         <Image
                            src="/glogo.png" // Your logo file
                            alt="G-Mobility Logo"
                            width={150}
                            height={150}
                        />
                    </div>
                    
                    {/* Walking People GIF */}
                    {/* <div>
                        <Image
                            src="/gif.gif" // Your GIF file
                            alt="Animated people walking"
                            width={1000} // Adjust size as needed
                            height={1000}
                            unoptimized
                        />
                    </div> */}
                </div>

                {/* Right Side Panel (with the semi-transparent blue overlay) */}
                <div className="relative w-1/2 h-full flex items-center justify-center">
                    {/* The blue overlay for the right half */}
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-90 backdrop-blur-sm"></div>
                    
                    {/* The text content, positioned on top of the blue overlay */}
                    <div className="relative z-20 text-white text-center p-10">
                        <h1 className="text-8xl md:text-9xl font-extrabold tracking-wider text-white/90" style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.2)' }}>
                            WELCOME
                        </h1>
                        <p className="mt-2 text-xl font-light tracking-widest text-white/80">
                            TO GMOBILITY'S STAFF PORTAL
                        </p>
                        <div className="mt-10">
                            <LiveClock />
                        </div>
                    </div>
                </div>
                
            </div>
        </main>
        
    );
}