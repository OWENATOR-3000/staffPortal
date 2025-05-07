import React from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import '../../styles/clockinclockout.css'
import SidebarNav from '../../components/sidebarNav';



const ViewClockInAndOutTimes = () => {
  const data = [
    { id: 1, name: "Emily", date: '09/04/2018', clockin: '07:00', clockout: '17:00' },
    { id: 2, name: "Owen", date: '09/04/2018', clockin: '07:15', clockout: '17:15' },
    { id: 3, name: "Talo", date: '09/04/2018', clockin: '07:30', clockout: '17:30' },
    { id: 4, name: "Christy", date: '09/04/2018', clockin: '07:30', clockout: '17:30' },
    { id: 5, name: "Hafeni", date: '09/04/2018', clockin: '07:30', clockout: '17:30' },
    { id: 6, name: "Domingo", date: '09/04/2018', clockin: '07:30', clockout: '17:30' },
    { id: 7, name: "Erastus", date: '09/04/2018', clockin: '07:30', clockout: '17:30' },
    { id: 8, name: "Hozei", date: '09/04/2018', clockin: '07:30', clockout: '17:30' },
  ];
  const position = useSelector((state)=> state.auth.position)
  
  return (
    <div>
      <Header /> 
        <SidebarNav position={position} /> 
        <div className='page-content'> 
          <h2>Staff clock in and out times</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Clock in</th>
                <th>Clock out</th>
              </tr>
            </thead>
            <tbody>
              {data.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.date}</td>
                  <td>{user.clockin}</td>
                  <td>{user.clockout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}
export default ViewClockInAndOutTimes
