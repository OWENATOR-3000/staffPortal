import React, { useEffect, useState } from 'react';
import '../../styles/OvertimerequestPage.css';
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import { useDispatch, useSelector } from 'react-redux';
import { createOvertimeRequest } from '../../overtimeSlice';

function OvertimerequestPage() {
  const auth = useSelector((state) => state.auth);
  const userData = auth.data && auth.data[0];
  const username = userData?.Name || 'User';
  const [position] = useState(auth.position || 'Employee');

  const [employeeName, setEmployeeName] = useState(username);
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [reason, setReason] = useState("");
  const [start_time, setStartTime] = useState("17:00");  // Default to 17:00
  const [end_time, setEndTime] = useState("18:00");  // Default to 18:00
  const dispatch = useDispatch();

  useEffect(() => {
    setEmployeeName(username);
  }, [username]);

  const calculateDuration = (start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    let startDate = new Date(0, 0, 0, startHour, startMinute);
    let endDate = new Date(0, 0, 0, endHour, endMinute);

    // If end time is 00:00, set it to next day
    if (endHour === 0 && endMinute === 0) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const diffInMs = endDate - startDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    return diffInHours > 0 ? diffInHours : 0;
  };

  useEffect(() => {
    if (start_time && end_time) {
      const calculatedDuration = calculateDuration(start_time, end_time);
      setDuration(calculatedDuration.toFixed(2));
    }
  }, [start_time, end_time]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Log the payload to see what is being sent
    const payload = {
      employeeName,
      position,  // Make sure this is included
      date,
      start_time,
      end_time,
      duration,
      reason
    };

    console.log("Sending payload:", payload); // Log the payload

    // Check that all required fields are present
    if (
      employeeName &&
      position &&
      date &&
      start_time &&
      end_time &&
      duration &&
      reason
    ) {
      dispatch(createOvertimeRequest(payload));
    } else {
      console.error("Missing required fields in the payload");
    }

    // Reset form fields
    setDate("");
    setStartTime("17:00");
    setEndTime("18:00");
    setDuration("");
    setReason("");
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 18; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(<option key={time} value={time}>{time}</option>);
      }
    }
    options.push(<option key="00:00" value="00:00">00:00</option>); // Add 00:00 (midnight) option
    return options;
  }

  return (
    <>
      <Header />
      <SidebarNav position={position} />
      <div className='main-content'>
        <div className="overtime-request-page">
          <h2>Overtime Request Form</h2>
          <form onSubmit={handleSubmit} className="overtime-form">
            <div className="form-group">
              <label htmlFor="employeeName">Employee Name</label>
              <input
                type="text"
                id="employeeName"
                name="employeeName"
                value={employeeName}
                readOnly
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="start_time">Overtime Start Time</label>
              <input
                type="text"
                id="start_time"
                name="start_time"
                value={start_time}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_time">Overtime End Time</label>
              <select
                id="end_time"
                name="end_time"
                value={end_time}
                onChange={(e) => setEndTime(e.target.value)}
                required
              >
                {generateTimeOptions()}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration (hours)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={duration}
                readOnly
              />
            </div>
            <div className="form-group">
              <label htmlFor="reason">Reason for Overtime</label>
              <textarea
                id="reason"
                name="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-btn">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default OvertimerequestPage;
