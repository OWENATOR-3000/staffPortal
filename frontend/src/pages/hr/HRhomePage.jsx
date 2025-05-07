import '../../styles/HRHomePage.css';
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';

function HRHomePage() {
  const position = useSelector((state) => state.auth.position);
  const userDetails = useSelector((state) => state.auth.data[0]);
  const userRoles = useSelector((state) => state.auth.userRoles);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const userPermissions = useSelector((state) => state.auth.userPermissions);

  const [latestLeave, setLatestLeave] = useState(null);
  const [latestOvertime, setLatestOvertime] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [todayClockIn, setTodayClockIn] = useState(null); // State for today's clock-in time
  const [payrollInfo, setPayrollInfo] = useState(null); // State for payroll information

  const onChange = (date) => setSelectedDate(date);

  useEffect(() => {
    // Check localStorage first for today's clock-in time (used right after login)
    const storedClockInTime = localStorage.getItem('todayClockIn');
    const storedClockInDate = localStorage.getItem('lastClockInDate');
    const today = new Date().toISOString().split('T')[0];
    
    // If we have a stored clock-in time from today, use it immediately
    if (storedClockInTime && storedClockInDate === today) {
      setTodayClockIn(storedClockInTime);
    }
    
    // Fetch the latest leave request (first row)
    fetch(`http://localhost:8080/employeeleave/${userDetails.Name}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setLatestLeave(data[0]); // Only the first record is set
        }
      })
      .catch((err) => console.error("Error fetching leave data:", err));

    // Fetch the latest overtime request (first row)
    fetch(`http://localhost:8080/employeeovertime/${userDetails.Name}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setLatestOvertime(data[0]); // Only the first record is set
        }
      })
      .catch((err) => console.error("Error fetching overtime data:", err));

    // Fetch the latest printing request (first row)
    fetch(`http://localhost:8080/api/getprinting/${userDetails.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setLatestReport(data[0]); // Only the first record is set
        }
      })
      .catch((err) => console.error("Error fetching printing request data:", err));

    // Fetch today's clock-in details
    fetch(`http://localhost:8080/clockin/${userDetails.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          const todayClockInData = data.find(clockin => {
            const clockinDate = new Date(clockin.date).toISOString().split('T')[0];
            return clockinDate === today;
          });
          
          if (todayClockInData) {
            console.log("Found clock-in data from API:", todayClockInData);
            setTodayClockIn(todayClockInData.clockinTime); // Set today's clock-in time from API
            
            // Update localStorage with the API data for consistency
            localStorage.setItem('todayClockIn', todayClockInData.clockinTime);
            localStorage.setItem('lastClockInDate', today);
          } else if (!storedClockInTime || storedClockInDate !== today) {
            // Only set to null if we don't have a valid stored time
            setTodayClockIn(null); // No clock-in time for today
          }
        }
      })
      .catch((err) => console.error("Error fetching clock-in data:", err));

    // Fetch payroll information
    fetch(`http://localhost:8080/hrpayroll/${userDetails.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          console.log("Payroll info:", data[0]); // Log to confirm structure and contents
          setPayrollInfo(data[0]); // Set the first item of the array
        } else {
          console.warn("No payroll data found.");
          setPayrollInfo(null);
        }
      })
      .catch((err) => console.error("Error fetching payroll data:", err));

  }, [userDetails.Name, userDetails.id]);

  return (
    <>
      <Header />
      <SidebarNav position={position} />
      <div className='homepagecontent'>
        <div id='innerhomepage'>
          <div id='horizon1'>
            <div id='greeting'>
              <h3>Welcome, {userDetails.Name}!</h3>
              <p>The staff portal awaits you.</p>
            </div>
            <div id='imagediv'>
              <img 
                src={`http://localhost:8080/staff/${userDetails.id}/profile-image`} 
                alt='Profile image' 
                id="homeprofileimage"
                onError={(e) => { e.target.src = '/path/to/default-image.png'; }}
              />
            </div>
          </div>
          <div id='horizon2'>
            <div id='homecardssection'>
              <Calendar id="calender" onChange={onChange} value={selectedDate} />
              <div id='allhomecards'>
                <div id='payrollcard'>
                  <div id='clockincard' 
              onClick={() => {
                if (userPermissions.includes(2) || userPermissions.includes(3)) {
                  navigate('/ClockinPage');
                } else {
                  // Optional: Show a message or handle cases where the user lacks permission
                  alert('You do not have permission to view this page.');
                }
              }}
                  >
                    <p>Today's Clock-In Time</p>
                    <h3>{todayClockIn ? todayClockIn : "No clock-in today"}</h3>
                  </div>
                  <div id='paycard'>
                    <p>Your Payroll Info</p>
                    <h4>{payrollInfo && payrollInfo.gross_pay !== undefined ? `N$ ${payrollInfo.gross_pay}` : "No payroll data"}</h4>
                  </div>
                </div>
                <div id='outterhomecards'>
                  <div className='homecards' id='leavecard' onClick={() => 
                      {userPermissions.includes(36) && (navigate('/leaveview'))}}>
                    <p className='title'>Latest Leave Request</p>
                    <h4>{latestLeave ? latestLeave.status : "No Records"}</h4>
                    <p>Sent: {latestLeave ? new Date(latestLeave.date).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div className='homecards' id='overtimecard' onClick={() => 
                      {userPermissions.includes(35) && (navigate('/overtimeview'))}}>
                    <p className='title'>Latest Overtime Request</p>
                    <h4>{latestOvertime ? latestOvertime.status : "No Records"}</h4>
                    <p>Sent: {latestOvertime ? new Date(latestOvertime.date).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div className='homecards' id='reportcard' onClick={() => 
                      {userPermissions.includes(37) && (navigate('/printingview'))}}>
                    <p className='title'>Latest Report Request</p>
                    <h4>{latestReport ? latestReport.status : "No Records"}</h4>
                    <p>Sent: {latestReport ? new Date(latestReport.date).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HRHomePage;
