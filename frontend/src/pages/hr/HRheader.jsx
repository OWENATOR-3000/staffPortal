import React from 'react';
import './style/index.css'
import { useNavigate, NavLink } from 'react-router-dom';
import profile from './assets/defaulticon.png'
import image1 from './assets/person3.png'
import image2 from './assets/time.png'
import image3 from './assets/person.png'
import image4 from './assets/person2.png'
import glogo from './assets/glogo.png'
import arrow from './assets/arrow.png'
import cash from './assets/mlogo.png'
import register from './assets/regicon.png'
import { useSelector } from 'react-redux';

function HRheader() {
  const navigate = useNavigate();

  //Function to handle logout
  const handleLogout = () => {
    navigate('/loginPage');
  };
  const user = useSelector((state) => state.auth.data[0]); // Accessing the first user object
  console.log("User Data:", user); // Log user data for debugging

  return (
    <>
      <div className="hrheader w-100 p-3">
        <img src={glogo}></img><p> Staff Portal</p>
      </div>
      <div className='hrsidebar'>
        {/*<img className='profileimg' src={profile} alt="Profile" />
        <p className='usersname'>Hafeni Neliwa</p>*/}
        <img className='profileimg' src={profile} alt="Profile" />
        <p className='usersname'>{user.Name + " " + user.Surname}</p>
        <img className='arrow' src={arrow}></img>
        <ul>

          <li onClick={event => navigate('/hrhome')}>
            <img className='icons' src={image4} alt="Home" /> Home
          </li>

          <li onClick={event => navigate('/hrleaverequests')}>
            <img className='icons' src={image1} alt="Leave Requests" /> Leave Requests
          </li>

          <li onClick={event => navigate('/hrovertimerequests')}>
            <img className='icons' src={image2} alt="Work Hours" /> Overtime Requests
          </li>

          <li onClick={event => navigate('/staffregistration')}>
            <img className='icons' src={register} alt="Register Staff" /> Register staff
          </li>

          <li onClick={event => navigate('/hrpayroll')}>
            <img className='icons' src={cash} alt="Staff Payroll" /> Staff Payroll
          </li>

          <li onClick={event => navigate('/hremployees')}>
            <img className='icons' src={image3} alt="Attendance" /> Staff
          </li>
          <li>
            <button className='hrlogout' onClick={(event) => window.location.reload()}>Logout</button>
          </li>
        </ul>
//         <button className='hrlogout' onClick={handleLogout}>Logout</button>
      </div>
    </>
  );
}

export default HRheader;
