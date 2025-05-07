import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import './ModernHRRequests.css';
import defaultimg from './assets/defaulticon.png';
import plus from './assets/plus.png';
import Header from '../../components/header.jsx';
import SidebarNav from '../../components/sidebarNav.jsx';

export default function ModernHRRequests() {
  const [isLeaveSelected, setIsLeaveSelected] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch leave and overtime requests
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('http://localhost:8080/leaverequests').then(res => res.json()),
      fetch('http://localhost:8080/overtimerequest').then(res => res.json())
    ])
      .then(([leaveData, overtimeData]) => {
        setLeaveRequests(leaveData);
        setOvertimeRequests(overtimeData);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch requests.');
        setLoading(false);
      });
  }, []);

  const requestData = isLeaveSelected ? leaveRequests : overtimeRequests;

  const userposition = useSelector((state)=> state.auth.position);
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarNav position={userposition} />
      <div style={{ flex: 1 }}>
        <Header />
        <div className="modern-hr-card">
      {/* Tabs and Create Buttons */}
      <div className="modern-hr-header-row">
        <div className="modern-hr-tabs">
          <div
            className={isLeaveSelected ? 'selected' : ''}
            onClick={() => { setIsLeaveSelected(true); setSelectedRequest(null); }}
            style={{ color: isLeaveSelected ? '#fff' : '#b30000', background: isLeaveSelected ? '#b30000' : '#fff' }}
          >
            Leave Requests
          </div>
          <div
            className={!isLeaveSelected ? 'selected' : ''}
            onClick={() => { setIsLeaveSelected(false); setSelectedRequest(null); }}
            style={{ color: !isLeaveSelected ? '#fff' : '#0e008b', background: !isLeaveSelected ? '#0e008b' : '#fff' }}
          >
            Overtime Requests
          </div>
        </div>
        <div className="modern-hr-create-buttons">
          <button className="modern-hr-btn filled" style={{ background: '#b30000' }}>
            <img src={plus} alt="plus" />
            Create Leave Request
          </button>
          <button className="modern-hr-btn outlined" style={{ color: '#0e008b', borderColor: '#0e008b' }}>
            <img src={plus} alt="plus" />
            Create Overtime Request
          </button>
        </div>
      </div>
      {/* 2-Column Layout */}
      <div className="modern-hr-body-row">
        <div className="modern-hr-requestlist">
          {loading ? (
            <div className="modern-hr-details-placeholder">Loading...</div>
          ) : error ? (
            <div className="modern-hr-details-placeholder" style={{ color: '#b30000' }}>{error}</div>
          ) : requestData.length === 0 ? (
            <div className="modern-hr-details-placeholder">No requests found.</div>
          ) : (
            requestData.map((req) => (
              <div
                key={req.id}
                className={`modern-hr-request-row${selectedRequest && selectedRequest.id === req.id ? ' active' : ''}`}
                onClick={() => setSelectedRequest(req)}
              >
                <img
                  className="modern-hr-propic"
                  src={req.profilepicture || defaultimg}
                  alt="profile"
                />
                <span className="modern-hr-empname">{req.employee_name}</span>
                <span className={`modern-hr-status-dot ${req.reqstatus}`}></span>
              </div>
            ))
          )}
        </div> 
        <div className="modern-hr-details">
          {selectedRequest ? (
            <div className="modern-hr-details-card">
              <h3 style={{marginBottom: '1.2rem'}}>{selectedRequest.employee_name}</h3>
              <table className="modern-hr-details-table">
                <tbody>
                  <tr>
                    <th>Status</th>
                    <td>{selectedRequest.status || selectedRequest.reqstatus}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>{isLeaveSelected ? 'Leave' : 'Overtime'}</td>
                  </tr>
                  {isLeaveSelected ? (
                    <>
                      <tr>
                        <th>From</th>
                        <td>{selectedRequest.start_date || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>To</th>
                        <td>{selectedRequest.end_date || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Total Days</th>
                        <td>{selectedRequest.total_days || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Reason</th>
                        <td>{selectedRequest.reason || 'N/A'}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <th>Date</th>
                        <td>{selectedRequest.start_time || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>End Time</th>
                        <td>{selectedRequest.end_time || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Duration</th>
                        <td>{selectedRequest.duration || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Reason</th>
                        <td>{selectedRequest.reason || 'N/A'}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="modern-hr-details-placeholder">
              Select a request to see the details.
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
