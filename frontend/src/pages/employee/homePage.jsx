// Using regular CSS instead of Tailwind
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import staffProfile from '../../assets/staffProfile.png';
import leaveRequest from '../../assets/leaveRequest.png';
import requestOvertime from '../../assets/requestOvertime.png'
import requestPrint from '../../assets/requestPrint.png'
import viewRequests from '../../assets/viewRequests.png'
import payroll from '../../assets/payroll.png'
import clockinout from '../../assets/clockinout.png'
import MessageFloat from '../hr/MessageFloat';
import SimpleChatPlatform from '../../components/MessagePlatfom.jsx';
import DigitalClock from '../../components/clock.jsx';
import styles from '../../styles/HomePage.module.css';


function HomePage() {
  const position = useSelector((state) => state.auth.position);
  const employeeName = useSelector((state) => state.auth.data[0]);

  const [showPopup, setShowPopup] = useState(false);
  const [showChatPlatform, setShowChatPlatform] = useState(false);

  console.log("User Data:", employeeName);
  if (!employeeName) {
    return <div>Loading...</div>;
  }

  // Array of department titles (if necessary, or replace with other employee-relevant data)
  const departments = [
    'Super Admin',
    'Admin',
    'HR',
    'DevOps',
    'Technical',
    'Accounting',
    'Printing',
  ];

  const handleEmployeeClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleToggleChat = () => {
    setShowChatPlatform((prev) => !prev);
  };

  return (
    <>
      <Header />
      <SidebarNav position={position} />
      <div className={styles['content-container']}>
        <div className={styles['message-float-container']}>
          <MessageFloat onClick={handleToggleChat} />
        </div>
        <div className={`${styles['profile-card2']} ${showPopup ? styles['blur-background'] : ''}`}>
          <div className={styles['profile-image']}>
            {employeeName.profileImg && employeeName.profileImg.length > 0 ? (
              <img src={`data:image/jpeg;base64,${employeeName.profileImg}`} alt="Profile" />
            ) : (
              <img src={staffProfile} alt="Profile" />
            )}
          </div>
          <h2>Welcome Employee {employeeName.Name}</h2>

        </div>
        {showChatPlatform && (
          <div className={styles['chat-platform']}>
            <div className={styles['chat-header']}>
              <h3>Staff Messages</h3>
              <button className={styles['close-chat']} onClick={handleToggleChat}>×</button>
            </div>
            <SimpleChatPlatform currentUser={employeeName} />
          </div>
        )}


        {/* Department Containers (can adjust this to reflect employee roles or actions) */}
        <div className={`${styles['department-containers2']} ${showPopup ? styles['blur-background'] : ''}`}>
          {departments.map((department, index) => (
            <div
              key={index}
              className={styles['department-container2']}
              onClick={department === 'DevOps' ? handleEmployeeClick : undefined}>
              <h3>{department}</h3>
            </div>
          ))}
        </div>

        {/* Employee Action Pop-up */}
        {showPopup && (
          <div className={styles['popup-container2']}>
            <div className={styles['popup-content2']}>
              <h2>As a DevOps you can:</h2>
              <ul>
                <li>
                  <img
                    src={staffProfile}
                    alt="View your profile"
                  />
                  View your profile
                </li>
                <li>
                  <img
                    src={leaveRequest}
                    alt="Request leave"
                  />
                  Request for leave
                </li>
                <li>
                  <img
                    src={requestOvertime}
                    alt="Request to work overtime"
                  />
                  Request to work overtime
                </li>
                <li>
                  <img
                    src={requestPrint}
                    alt="Request to print"
                  />
                  Request to print
                </li>
                <li>
                  <img
                    src={viewRequests}
                    alt="View feedback for your requests"
                  />
                  View feedback for your requests
                </li>
                <li>
                  <img
                    src={payroll}
                    alt="payroll information"
                  />
                  View your payroll information
                </li>
                <li>
                  <img
                    src={clockinout}
                    alt=" Clock in/out"
                  />
                  Clock in/out
                </li>
              </ul>
              <button className={styles['return-button2']} onClick={handleClosePopup}>
                Return
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default HomePage;
