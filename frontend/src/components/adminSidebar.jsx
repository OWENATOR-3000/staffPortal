import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import '../styles/adminSidebarStyling.css'
import profile from '../assets/defaulticon.png'
import image1 from '../assets/person3.png'
import image2 from '../assets/time.png'
import image3 from '../assets/person.png'
import image4 from '../assets/person2.png'
import arrow from '../assets/arrow.png'
import Header from './header'

function AdminSidebar() {

  //State to track the current active tab
  const [activeTab, setActiveTab] = useState('adminHomePage');

  //Function to handle tab click and set the active tab
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };


  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossOrigin="anonymous"></link>
      <div className='Admin-sidebar'>
        <img className='arrow' src={arrow}></img>

        <a
          href="/adminHomePage" className={activeTab === 'adminHomePage' ? 'active' : ''} onClick={() => handleTabClick('adminHomePage')}>Home
        </a>
        <a
          href="/staffRegistrationAdmin" className={activeTab === 'staffRegistrationAdmin' ? 'active' : ''} onClick={() => handleTabClick('staffRegistration')}>Register a staff member
        </a>
        <a
          href="/staffProfiles" className={activeTab === 'staffProfiles' ? 'active' : ''} onClick={() => handleTabClick('staffProfiles')}>Staff profiles
        </a>
        <a
          href="/viewPrintingRequests" className={activeTab === 'viewPrintingRequests' ? 'active' : ''} onClick={() => handleTabClick('viewPrintingRequests')}>Printing requests
        </a>
        <a
          href="/viewLeaveRequest" className={activeTab === 'viewLeaveRequest' ? 'active' : ''} onClick={() => handleTabClick('viewLeaveRequest')}>Leave request
        </a>
        <a
          href="/viewovertimeRequests" className={activeTab === 'viewovertimeRequests' ? 'active' : ''} onClick={() => handleTabClick('viewovertimeRequests')}>Overtime request
        </a>
        <a
          href="/viewClockinClockout" className={activeTab === 'viewClockinClockout' ? 'active' : ''} onClick={() => handleTabClick('viewClockinClockout')}>View clock in and clock out times
        </a>

        <button className="adminlogout">Logout</button>
      </div>

      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossOrigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.7/dist/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossOrigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossOrigin="anonymous"></script>
    </>
  )
}

export default AdminSidebar