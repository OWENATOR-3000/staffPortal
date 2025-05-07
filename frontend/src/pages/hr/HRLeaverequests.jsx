import './style/index.css';
import Header from '../../components/header.jsx';
import SidebarNav from '../../components/sidebarNav.jsx';
import defaultimg from './assets/defaulticon.png';
import unseen from './assets/unseen.png';
import seen from './assets/seenstatus.png';
import plus from './assets/plus.png'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';

function HRLeaverequests() {
  const navigate = useNavigate()
  const [data, setData] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const userposition = useSelector((state)=> state.auth.position)

  useEffect(() => {
    fetch('http://localhost:8080/leaverequests') // Updated port to 8080
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        console.log(data);
        setData(data);
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const updateRequestStatus = (requestId, status, msgstatus) => {
    fetch(`http://localhost:8080/leaverequests/${requestId}`, { // Updated port to 8080
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, msgstatus }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        console.log('Status updated:', data);
        // Update local state to reflect changes
        setData(prevData => 
          prevData.map(request => 
            request.id === requestId ? { ...request, status, msgstatus } : request
          )
        );
      })
      .catch(err => console.error('Error updating status:', err));
  };

  const handleClick = (request) => {
    // Mark the request as seen
    const updatedData = data.map(d =>
      d.id === request.id ? { ...d, msgstatus: 'seen' } : d
    );
    setData(updatedData);
    setSelectedRequest(request);
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
         <SidebarNav position={userposition}/>      <div className='requestcontainer'>
        <div className='hrleaverequests'>
          <div className='tablediv'>
            <table className='fromtable'>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="3">No employees found.</td>
                  </tr>
                ) : (
                  data.map((d, i) => (
                    <tr key={d.id} onClick={() => handleClick(d)}>
                      <td id="picdiv">
                        <img id="innerpropic" src={d.profilepicture || defaultimg} alt="profile" />
                      </td>
                      <td id="leavesender">{d.employee_name}</td>
                      <td>
                        {d.msgstatus === 'unseen' && <img id="msgstatus" src={unseen} alt="unseen" />}
                        {d.msgstatus === 'seen' && <img id="msgstatus" src={seen} alt="seen" />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className='requeststructure'>
            <h3>Leave Requests</h3>
            {selectedRequest ? (
              <table>
                <tbody>
                  <tr>
                    <td><p className='titl'>From:</p></td>
                    <td><p>{selectedRequest.employee_name}</p></td>
                    <td><p className='titl'>Start Date:</p></td>
                    <td><p>{selectedRequest.start_date.split('T')[0] || 'N/A'}</p></td>
                  </tr>
                  <tr>
                    <td><p className='titl'>Position:</p></td>
                    <td><p>{selectedRequest.position || 'N/A'}</p></td>
                    <td><p className='titl'>End Date:</p></td>
                    <td><p>{selectedRequest.end_date.split('T')[0] || 'N/A'}</p></td>
                  </tr>
                  <tr>
                    <td><p className='titl'>Total Days:</p></td>
                    <td><p>{selectedRequest.total_days || 'N/A'}</p></td>
                    <td><p className='titl'>Status:</p></td>
                    <td><p>{selectedRequest.status || 'Pending'}</p></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>Select a request to see the details.</p>
            )}
            {selectedRequest && (
              <div id="leavereason">
                <div id="leavereasontext">
                  <p>{selectedRequest.reason || 'N/A'}</p>
                </div>
              </div>
            )}
            {selectedRequest && selectedRequest.status === 'Pending' && (
              <>
                <button className='leavebuttons' id="but1" onClick={() => handleApprove(selectedRequest)}>Approve</button>
                <button className='leavebuttons' id="but2" onClick={() => handleReject(selectedRequest)}>Reject</button>
              </>
            )}
          </div>
        </div>

        <div id="newleaverequest" onClick={event =>  navigate('/hrrequestleave')}>
             <img src={plus}></img>
             <p>Create Leave request</p>
        </div>

      </div>
    </>
  );
}

export default HRLeaverequests;
