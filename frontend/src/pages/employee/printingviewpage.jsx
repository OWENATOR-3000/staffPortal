import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import '../../styles/OvertimeViewPage.css'; 

function PrintingViewPage() {
  const position = useSelector((state) => state.auth.position);
   const user = useSelector((state) => state.auth.data[0]);
   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(true); // Loading state
   const [error, setError] = useState(null); // Error state
 
   console.log("User Data:", user); // Log user data for debugging

   useEffect(() => {
       if (user) {
           console.log("Fetching data for user:", user.Name);
           fetch(`http://localhost:8080/api/getprinting/${user.id}`)
               .then(res => {
                   if (!res.ok) {
                       throw new Error('Network response was not ok');
                   }
                   return res.json();
               })
               .then(data => {
                   console.log("Fetched data:", data);
                   setData(data);
               })
               .catch(err => {
                   console.error('Fetch error:', err);
                   setError('Failed to fetch printing requests.'); // Set error message
               })
               .finally(() => {
                   setLoading(false); // Set loading to false after fetch
               });
       }
   }, [user]);

   // Loading or error states
   if (loading) {
       return <div>Loading...</div>;
   }
   if (error) {
       return <div>{error}</div>; // Display error message
   }
   if (!user) {
       return <div>User data not found.</div>; // Fallback if user is not defined
   }

   return (
       <>
           <Header />
           <SidebarNav position={position}/>
           <div className='main-content'>
               <div className="overtime-view-page">
                   <h2>History of Report Requests</h2>
                   <table className="overtime-table">
                       <thead>
                           <tr>
                               <th>Date Sent</th>
                               <th>Type</th>
                               <th>Email</th>
                               <th>Status</th>
                           </tr>
                       </thead>
                       <tbody>
                           {data.length > 0 ? (
                               data.map((request) => {
                                   let statusColor;

                                   // Determine color based on request status
                                   if (request.status === 'unsent') {
                                       statusColor = 'gray';
                                   } else if (request.status === 'Sent') {
                                       statusColor = 'limegreen';
                                   } else {
                                       statusColor = 'red'; // Assuming any other status is an error or rejected
                                   }

                                   return (
                                       <tr key={request.id}>
                                           <td>{request.date}</td>
                                           <td>{request.type}</td>
                                           <td>{request.email}</td>
                                           <td style={{ backgroundColor: statusColor }}>{request.status}</td>
                                       </tr>
                                   );
                               })
                           ) : (
                               <tr>
                                   <td colSpan="6">No Report requests found.</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       </>
   );
}

export default PrintingViewPage;
