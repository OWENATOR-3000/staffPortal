import styles from '../../styles/AdminHomePage.module.css';
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import MessageFloat from '../hr/MessageFloat';
import SimpleChatPlatform from '../../components/MessagePlatfom';

function AdminHomePage() {
  const position = useSelector((state) => state.auth.position);
  const adminName = useSelector((state) => state.auth.data[0]);
  const [showChatPlatform, setShowChatPlatform] = useState(false);

  if (!adminName) {
    return <div>Loading...</div>;
  }

  const handleToggleChat = () => {
    setShowChatPlatform((prev) => !prev);
  }

  return (
    <>
      <Header />
      <SidebarNav position={position} />
      <div className={styles['main-content']}>
        <MessageFloat onClick={handleToggleChat} />
        <div className={styles['profile-card4']}>
          <h2>Welcome Admin {adminName.Name}</h2>
          <p>Use the side navigation menu to access different functions:</p>
          <ul className={styles['admin-dashboard-menu']}>
            <li>User Rights Management - View and manage department permissions</li>
            <li>View Employees - Access staff directory and profiles</li>
            <li>View Requests - Manage leave, overtime, and printing requests</li>
            <li>Staff Registration - Add new staff members to the system</li>
          </ul>
        </div>

        {showChatPlatform && (
          <div className={styles['chat-platform']}>
            <SimpleChatPlatform currentUser={adminName} />
          </div>
        )}
      </div>
    </>
  );
}

export default AdminHomePage;
