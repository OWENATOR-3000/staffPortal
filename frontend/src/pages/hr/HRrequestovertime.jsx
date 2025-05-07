import React, { useEffect, useState } from 'react';
import '../../styles/OvertimerequestPage.css'; // Assuming you use a CSS file for styles
import { useDispatch, useSelector } from 'react-redux';
import { createOvertimeRequest } from '../../overtimeSlice';
import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';

function HROvertimerequestPage() {

  const [employeeName, setName] = useState("");
  const [date, setDate] = useState("")
  const [duration, setDuration] = useState("")
  const [reason, setReason] = useState("");
  const [start_time, setStartTime] = useState();
  const [end_time, setEndTime] = useState();
  const dispatch = useDispatch();

  const userData = useSelector((state) => state.auth.data[0]); 
  const pos = userData?.Position || 'Employee';
  const [position, setPosition] = useState(pos);
  // State to handle form inputs
  // const [formData, setFormData] = useState({
  //   employeeName: '',
  //   date: '',
  //   hoursWorked: '',
  //   reason: '',
  // });

  // // Handle input changes
  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  // // Handle form submission
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log('Form data:', formData);
  //   // Add form submission logic (e.g., API call)
  // };

 

  const calculateDuration = (start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startDate = new Date();
    startDate.setHours(startHour, startMinute);

    const endDate = new Date();
    endDate.setHours(endHour, endMinute);

    const diffInMs = endDate - startDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    return diffInHours > 0 ? diffInHours : 0;
  }

  useEffect(()=>{
    if (start_time && end_time) {
      const calculatedDuration = calculateDuration(start_time, end_time);
      setDuration(calculatedDuration.toFixed(2));
    }
  }, [start_time, end_time]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedStartTime = start_time.includes(':') ? `${start_time}:00` : start_time;
    const formattedEndTime = end_time.includes(':') ? `${end_time}:00` : end_time;

    if(
      employeeName &&
      position &&
      date &&
      start_time &&
      end_time &&
      duration &&
      reason
    ) {
      dispatch(createOvertimeRequest({
        employeeName,
        position,
        date,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        duration,
        reason
      }))
    };

    setName("");
    setDate("");
    setStartTime();
    setEndTime();
    setDuration("");
    setReason("");
  }

  useEffect(() => {
    setPosition(pos);
  },  [pos]);
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
            onChange={e=>setName(e.target.value)}
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
            onChange={e=>setDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="start_time">Overtime Start Time</label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            value={start_time}
            onChange={(e) => setStartTime(e.target.value)}
            required
            />
        </div>
        <div className="form-group">
          <label htmlFor="end_time">Overtime End Time</label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            value={end_time}
            onChange={(e) => setEndTime(e.target.value)}
            required
            />
        </div>
        <div className="form-group">
          <label htmlFor="hoursWorked">Duration</label>
          <input
            type="number"
            id="hoursWorked"
            name="hoursWorked"
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
            onChange={e=>setReason(e.target.value)}
            required
          />
        </div>
        <button 
        type="submit" 
        className="submit-btn"
        onClick={handleSubmit}>
          Submit Request</button>
      </form>
    </div>
      </div>
    </>
  );
}

export default HROvertimerequestPage;
