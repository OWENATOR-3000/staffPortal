import React, { useState, useEffect } from 'react';
import '../../styles/AdminRequests.css'; 
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState('Leave requests'); 
  const [requests, setRequests] = useState([]); 
  const [selectedEmployee, setSelectedEmployee] = useState(null); 

  // Function to fetch requests from your existing endpoints
  const fetchRequests = async (requestType) => {
    let endpoint = '';
    if (requestType === 'Leave requests') {
      endpoint = '/leaverequests'; 
    } else if (requestType === 'Overtime requests') {
      endpoint = '/overtimerequest'; 
    } else if (requestType === 'Printing requests') {
        endpoint = '/printingrequests';    
    }
    else {
        setRequests([]);
        return;
    }

    try {
      const response = await fetch(endpoint); 
      const data = await response.json();
      setRequests(data); 
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  // Fetch requests whenever the active tab changes
  useEffect(() => {
    fetchRequests(activeTab);
    setSelectedEmployee(null); 
  }, [activeTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    employee.isRead = true; 
  };

  return (
    <>
    <SidebarNav />
    <Header />
    <div className="admin-requests-container">
      {/* Tabs */}
      <div className="tabs">
        {['Leave requests', 'Overtime requests', 'Printing requests'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Employee Request List */}
      <div className="request-list">
        {requests.map((employee, index) => (
          <div
            key={index}
            className={`employee-item ${employee.isRead ? '' : 'unread'}`}
            onClick={() => handleEmployeeClick(employee)}
          >
            {employee.name}
            {!employee.isRead && <span className="dot"></span>}
          </div>
        ))}
      </div>

      {/* Request Details Section */}
      {selectedEmployee && (
        <div className="request-details">
          <h3>Request from {selectedEmployee.name}</h3>
          <p>{selectedEmployee.details}</p>
          <div className="buttons">
            <button className="approve-btn">Approve</button>
            <button className="reject-btn">Reject</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminRequests;
