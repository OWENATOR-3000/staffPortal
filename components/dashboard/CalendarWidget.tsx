// components/dashboard/CalendarWidget.tsx
"use client"; 

import { useState, useEffect } from 'react'; // 1. Add useEffect
import Calendar from 'react-calendar';
import { isSaturday, isSunday } from 'date-fns';

import 'react-calendar/dist/Calendar.css';
import './CalendarWidget.css'; 

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function CalendarWidget() {
  const [date, setDate] = useState<Value>(new Date());
  
  // 2. Add a new state to track if the component has mounted on the client
  const [isClient, setIsClient] = useState(false);

  // 3. Use useEffect to set isClient to true after the initial render
  useEffect(() => {
    setIsClient(true);
  }, []);

  function tileClassName({ date, view }: { date: Date, view: string }) {
    if (view === 'month') {
      if (isSaturday(date) || isSunday(date)) {
        return 'weekend';
      }
    }
    return null;
  }

  return (
    <div>
      {/* 4. Conditionally render the Calendar only when isClient is true */}
      {isClient ? (
        <Calendar 
          onChange={setDate} 
          value={date}
          className="react-calendar"
          tileClassName={tileClassName}
        />
      ) : (
        // You can show a loading skeleton or a simple placeholder here
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading Calendar...</p>
        </div>
      )}
    </div>
  );
}