import React, { useEffect, useState } from 'react'
import SidebarNav from '../../components/sidebarNav'
import Header from '../../components/header'
import '../../styles/leaverequest.css'
import { useDispatch, useSelector } from 'react-redux'
import { createLeaveRequest } from '../../leaveSlice'

function LeaveRequest() {
  const auth = useSelector((state) => state.auth);
  const userData = useSelector((state) => state.auth.data[0]); 
  const username = userData?.Name || 'User';
  const pos = userData?.Position || 'Employee';


  const [employeeName, setEmployeeName] = useState(username);
  const [position, setPosition] = useState(pos);
  const [date, setDate] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [resumingWorkDay, setResumingWorkDay] = useState("");
  const [reason, setReason] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyAddress, setEmergencyAddress] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    setEmployeeName(username);
    setPosition(pos);
  }, [username]  [pos]);


  const calculateResumingWorkDay = () => {
    if (endDate) {
      const end = new Date(endDate);
      const resumingDay = new Date(end);
      resumingDay.setDate(resumingDay.getDate() + 1);
      setResumingWorkDay(resumingDay.toISOString().split("T")[0]);
    } else {
      setResumingWorkDay("");
    }
  };

  const calculateTotalDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays);
    } else {
      setTotalDays(0);
    }
  };

  useEffect(() => {
    calculateResumingWorkDay();
    calculateTotalDays();
  }, [startDate, endDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", {
      employeeName,
      position,
      date,
      supervisorName,
      startDate,
      endDate,
      totalDays,
      resumingWorkDay,
      reason,
      emergencyName,
      emergencyAddress,
      emergencyPhone,
    });
    if (
      date &&
      supervisorName &&
      position &&
      startDate &&
      endDate &&
      totalDays > 0 && 
      resumingWorkDay &&
      reason &&
      emergencyName &&
      emergencyAddress &&
      emergencyPhone
    ) {
      dispatch(createLeaveRequest({
        employeeName,
        position,
        date,
        supervisorName,
        startDate,
        endDate,
        totalDays,
        resumingWorkDay,
        reason,
        emergencyName,
        emergencyAddress,
        emergencyPhone,
      }));
      // Clear form fields after submission
      setDate("");
      setSupervisorName("");
      setStartDate("");
      setEndDate("");
      setTotalDays(0);
      setResumingWorkDay("");
      setReason("");
      setEmergencyName("");
      setEmergencyAddress("");
      setEmergencyPhone("");
    }
  };

  const handleClear = () => {
    setDate("");
    setSupervisorName("");
    setStartDate("");
    setEndDate("");
    setTotalDays(0);
    setResumingWorkDay("");
    setReason("");
    setEmergencyName("");
    setEmergencyAddress("");
    setEmergencyPhone("");
  };

  return (
    <div className='contain'>
      <Header />
      <SidebarNav position={position}/>
        <div className='main-content'>
          <div className='head'>
            <form className='leave_request_form' onSubmit={handleSubmit}>
              <h2>Employee Leave Application form</h2>
                <table>
                  <tbody>
                    <tr>
                      <td>Employee Name</td>
                      <td><input 
                      type="text" 
                      name="EmployeeName" 
                      value={employeeName} 
                      readOnly
                      required/>
                      </td>
                    </tr>
                    <tr>
                      <td>Date</td>
                      <td><input 
                      type="date" 
                      name="date" 
                      value={date} 
                      onChange={e=>setDate(e.target.value)}
                      required/>
                      </td>
                    </tr>
                    <tr>
                      <td>Supervisor Name</td>
                      <td><input 
                      type="text" 
                      name="SupervisorName" 
                      value={supervisorName} 
                      onChange={e=>setSupervisorName(e.target.value)}
                      required/>
                      </td>
                    </tr>
                  </tbody>
                </table>
              <h3>Leave Requested</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Start Date:</td>
                    <td><input 
                      type="date" 
                      name="start_date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                    />
                    </td>
                  </tr>
                  <tr>
                    <td>End Date:</td>
                    <td>
                      <input
                        type="date"
                        name="end_date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        required
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Total Days:</td>
                    <td>
                      <input
                        type="number"
                        name="total_days"
                        value={totalDays}
                        readOnly
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Resuming Work Day:</td>
                    <td>
                      <input
                        type="date"
                        name="resuming_work_day"
                        value={resumingWorkDay}
                        readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td>Reason:</td>
                    <td><textarea 
                      name="reason"
                      placeholder='Exam/Sick/Other'
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      required /></td>
                  </tr>
                </tbody>
              </table>
              <h3>Emergency Contact</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Name:</td>
                    <td><input 
                    type="text" 
                    name="emergency_name"
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    required/></td>
                  </tr>
                  <tr>
                    <td>Address:</td>
                    <td><input 
                    type="text" 
                    name="emergency_address"
                    value={emergencyAddress}
                    onChange={e => setEmergencyAddress(e.target.value)}
                    required/></td>
                  </tr>
                  <tr>
                    <td>Phone Number:</td>
                    <td><input 
                    type="text" 
                    name="emergency_phone"
                    value={emergencyPhone}
                    onChange={e=>setEmergencyPhone(e.target.value)}
                    required/></td>
                  </tr>
                </tbody>
              </table>
              <div className="instructions">
                <h4>How to Submit Leave Permission</h4>
                <ol>
                  <li>Employee has to submit leave application form at least 14 days prior to leave taken.</li>
                  <li>Leave application must be verified by HR.</li>
                  <li>Verified application will be taken to direct superior.</li>
                  <li>The original application will be given back to HR. Employee will be given a copy.</li>
                </ol>
              </div>
              <div className='button-container'>
                <button type="button" className='clear-button' onClick={handleClear}>
                  Clear
                </button>
                <button className='submit-button' type='submit'>Submit</button>
              </div>
            </form>
          </div>  
        </div>
    </div>
  );
}

export default LeaveRequest;