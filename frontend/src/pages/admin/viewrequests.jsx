import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useSelector } from 'react-redux';
import unseen from '../hr/assets/unseen.png';
import seen from '../hr/assets/seenstatus.png';
import defaultimg from '../hr/assets/defaulticon.png';
import { useEffect, useState } from 'react';
import plus from '../hr/assets/plus.png'
import { useNavigate } from 'react-router-dom';

function viewrequests() {
    const position = useSelector((state) => state.auth.position);
    const navigate = useNavigate();
    
    const [leaveData, setLeaveData] = useState([]);
    const [overtimeData, setOvertimeData] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLeaveSelected, setIsLeaveSelected] = useState(true); // State to track selected category
    const [lineBackgroundColor, setLineBackgroundColor] = useState('#b30000'); // Default color for leave requests

    // Fetch leave requests
    useEffect(() => {
        fetch('http://localhost:8080/leaverequests')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                setLeaveData(data);
            })
            .catch(err => console.error('Fetch error:', err));
    }, []);

    // Fetch overtime requests
    useEffect(() => {
        fetch('http://localhost:8080/overtimerequest')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                setOvertimeData(data);
            })
            .catch(err => console.error('Fetch error:', err));
    }, []);

    const handleSelectLeave = () => {
        setIsLeaveSelected(true);
        setSelectedRequest(null);
        setLineBackgroundColor('#b30000'); // Set color for leave requests
    };

    const handleSelectOvertime = () => {
        setIsLeaveSelected(false);
        setSelectedRequest(null);
        setLineBackgroundColor('#0e008b'); // Set color for overtime requests
    };

    const hasPendingLeaveRequests = () => leaveData.some(request => request.status === 'Pending');
    const hasPendingOvertimeRequests = () => overtimeData.some(request => request.status === 'Pending');

    const updateRequestStatus = (requestId, status, reqstatus) => {
        const endpoint = isLeaveSelected ? 'leaverequests' : 'overtimerequest';
        fetch(`http://localhost:8080/${endpoint}/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, reqstatus }),
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(() => {
            // Re-fetch data to keep it updated
            if (isLeaveSelected) {
                fetch('http://localhost:8080/leaverequests')
                    .then(res => res.json())
                    .then(setLeaveData);
            } else {
                fetch('http://localhost:8080/overtimerequest')
                    .then(res => res.json())
                    .then(setOvertimeData);
            }
        })
        .catch(err => console.error('Error updating status:', err));
    };

    const handleClickRequest = (request) => {
        setSelectedRequest(request);
        const updatedData = isLeaveSelected ? leaveData : overtimeData;
        const newData = updatedData.map(d => d.id === request.id ? { ...d, reqstatus: 'seen' } : d);
        if (isLeaveSelected) {
            setLeaveData(newData);
        } else {
            setOvertimeData(newData);
        }
        updateRequestStatus(request.id, request.status, 'seen');
    };

    const handleApprove = (request) => {
        updateRequestStatus(request.id, 'Approved', 'seen');
    };

    const handleReject = (request) => {
        updateRequestStatus(request.id, 'Rejected', 'seen');
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className='main-content'>
            <div className="requestcontent">
                <div id="newsizediv">
                <div id="requestselect">
                    <div id="selectleave" onClick={handleSelectLeave}>
                        <p>Leave Requests</p>
                        {hasPendingLeaveRequests() && <img src={unseen} alt='status' />}
                    </div>
                    <div id="selectovertime" onClick={handleSelectOvertime}>
                        <p>Overtime Requests</p>
                        {hasPendingOvertimeRequests() && <img src={unseen} alt='status' />}
                    </div>
                </div>
                <div id="requestbody">
                    <p id="line" style={{ backgroundColor: lineBackgroundColor }}></p>
                    <div id="requestsect">
                        <div id="requestlist">
                            <table id="requesttable1">
                                {(isLeaveSelected ? leaveData : overtimeData).map((request) => (
                                    <tr key={request.id} onClick={() => handleClickRequest(request)}>
                                        <td>
                                            <img id="propic" src={request.profilepicture || defaultimg} alt="profile" />
                                            <p>{request.employee_name}</p>
                                            <img id="reqstatus" src={request.reqstatus === 'unseen' ? unseen : seen} alt="status" />
                                        </td>
                                    </tr>
                                ))}
                            </table>
                        </div>
                        <div id="requestlistdetails">
                            {selectedRequest ? (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>From:</td>
                                            <td>{selectedRequest.employee_name}</td>
                                        </tr>
                                        <tr>
                                            <td>Position:</td>
                                            <td>{selectedRequest.position || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>Start Date:</td>
                                            <td>{selectedRequest.start_date || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>End Date:</td>
                                            <td>{selectedRequest.end_date || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Days:</td>
                                            <td>{selectedRequest.total_days || selectedRequest.duration || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>Reason:</td>
                                            <td>{selectedRequest.reason || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>Status:</td>
                                            <td>{selectedRequest.status || 'Pending'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <p>Select a request to see the details.</p>
                            )}
                            {selectedRequest && selectedRequest.status === 'Pending' && (
                                <>
                                    <button className='requestapprove' onClick={() => handleApprove(selectedRequest)}>Approve</button>
                                    <button className='requestreject' onClick={() => handleReject(selectedRequest)}>Reject</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                </div>
                
          </div>
            </div>
        </>
    );
}

export default viewrequests;
