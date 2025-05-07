import React, { useState, useEffect } from 'react';
import glogo from '../assets/glogo.png';
import '../styles/headerstyling.css';
import MessagingFloat from './MessagePlatfom.jsx';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '../utils/permissionHelper';
function Header() {
  const [showChat, setShowChat] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000); // Update time every second

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);


  const userPermissions = useSelector((state) => state.auth.userPermissions);
  const userDetails = useSelector((state) => state.auth.data[0]);
  // Debug: Log permissions to the console
  console.log('userPermissions:', userPermissions);
  console.log('PERMISSIONS:', PERMISSIONS);

  return (
    <div className="headerheader ">
      <img src={glogo} alt="Logo" />
      <p>Staff Portal</p>
      <h4 id='currenttime'>{currentTime}</h4>
      {hasPermission(userPermissions, PERMISSIONS.USE_MESSAGING) && userDetails && (
        <>
          <button
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 1000,
              background: '#1c2980',
              border: 'none',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowChat(true)}
            title="Open Messaging Platform"
          >
            <span style={{ color: 'white', fontSize: '2rem' }}>💬</span>
          </button>
          {showChat && (
            <>
              <div style={{
                position: 'fixed',
                bottom: '100px',
                right: '30px',
                zIndex: 1100,
                width: '600px',
                height: '600px',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '44px',
                  background: '#fff',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '0 8px',
                }}>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      zIndex: 1200,
                      marginLeft: 'auto',
                    }}
                    onClick={() => setShowChat(false)}
                    title="Close Chat"
                  >
                    ×
                  </button>
                </div>
                <MessagingFloat currentUser={userDetails} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Header;
