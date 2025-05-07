import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import './style/HRstyle.css'
import defaultimg from './assets/defaulticon.png'
import unseen from './assets/unseen.png';
import seen from './assets/seenstatus.png';
import plus from './assets/plus.png'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function HROvertimerequests(){
  const position = useSelector((state)=> state.auth.position)
  const navigate = useNavigate()
   const [data, setData] = useState([]);
   const [selectedRequest, setSelectedRequest] = useState(null);

   useEffect(() => {
      fetch('http://localhost:8080/overtimerequest')
        .then(res => {
          if (!res.ok) {
            throw new Error('Network response was not ok');
          }
          return res.json();
        })
        .then(data => {
          console.log(data); // Log the fetched data to inspect its structure
          setData(data);
        })
        .catch(err => console.error('Fetch error:', err));
    }, []);
   
    const updateRequestStatus = (requestId, status, reqstatus) => {
      fetch(`http://localhost:8080/overtimerequest/${requestId}`, {
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
      .then(data => {
        console.log('Status updated:', data);
      })
      .catch(err => console.error('Error updating status:', err));
    };

    const handleClick = (request) => {
      const updatedData = data.map(d =>
        d.id === request.id ? { ...d, reqstatus: 'seen' } : d
      );
      setData(updatedData);
      setSelectedRequest(request);
      updateRequestStatus(request.id, request.status, 'seen');
    };
  
    const handleApprove = (request) => {
      const updatedData = data.map(d =>
        d.id === request.id ? { ...d, status: 'Approved', reqstatus: 'seen' } : d
      );
      setData(updatedData);
      setSelectedRequest(request);
      updateRequestStatus(request.id, 'Approved', 'seen');
    };
  
    const handleReject = (request) => {
      const updatedData = data.map(d =>
        d.id === request.id ? { ...d, status: 'Rejected', reqstatus: 'seen' } : d
      );
      setData(updatedData);
      setSelectedRequest(request);
      updateRequestStatus(request.id, 'Rejected', 'seen');
    };
    return(
        <>
    <Header />
    <SidebarNav position={position}/>
        <div id="hrovertimediv">
        <div className='overtimediv'>
           <div className='fromtablecontainer'>
           <table className='fromtable'>
           <tbody>
           {data.length === 0 ? (
                  <tr>
                    <td colSpan="3">No requests currently.</td>
                  </tr>
                ) : (
                  data.map((d, i) => (
                    <tr id="innerrow" key={i} onClick={() => handleClick(d)}>
                      <td>
                        <img id="innerpropic" src={d.profilepicture || defaultimg} alt="profile" />
                      </td>
                      <td>{d.employee_name}</td>
                      <td id="reqstatus">
                        {d.reqstatus === 'unseen' && <img id="reqstatus" src={unseen} alt="unseen" />}
                        {d.reqstatus === 'seen' && <img id="reqstatus" src={seen} alt="seen" />}
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
           </table>
           </div>
        <div className='overtimecontent'>
            <h4>Overtime Requests</h4>
            {selectedRequest ? (
              <table>
                <tbody>
                  <tr>
                    <td><p className='titl'>From:</p></td>
                    <td><p>{selectedRequest.employee_name}</p></td>
                    <td><p className='titl'>Position:</p></td>
                    <td><p>{selectedRequest.position || 'N/A'}</p></td>
                  </tr>
                  <tr>
                    <td><p className='titl'>Start Date:</p></td>
                    <td><p>{selectedRequest.start_date || 'N/A'}</p></td>
                    <td><p className='titl'>End Date:</p></td>
                    <td><p>{selectedRequest.end_date || 'N/A'}</p></td>
                  </tr>
                  <tr>
                    <td><p className='titl'>Total Days:</p></td>
                    <td><p>{selectedRequest.duration || 'N/A'}</p></td>
                    <td><p className='titl'>Status:</p></td>
                    <td><p>{selectedRequest.status || 'Pending'}</p></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p>Select a request to see the details.</p>
            )}
          
            {selectedRequest && selectedRequest.status === 'Pending' && (
              <>
                <button className='overtimeapprove' onClick={() => handleApprove(selectedRequest)}>Approve</button>
                <button className='overtimereject' onClick={() => handleReject(selectedRequest)}>Reject</button>
              </>
            )}
          </div>
        </div>
        <div id="newovertimereq"  onClick={event =>  navigate('/hrrequestovertime')}>
              <img src={plus}></img>
              <p>Create Overtime Request</p>
          </div>
          </div>
    </>
  );
}

export default HROvertimerequests