import React from 'react'
import Header from '../../components/header'
import '../../styles/printingrequest.css'
import AdminSidebar from '../../components/adminSidebar'
import SidebarNav from '../../components/sidebarNav'
import {useSelector} from 'react-redux'


function ViewOvertimeRequests() {
  const position = useSelector((state)=> state.auth.position)
  return (
    <>
      <Header />
      <SidebarNav position={position}/>
      <div className='main-content'>
        <div className='head'>
          <form className='Printing_Request_Page'>
            <p>From: Tomy Jakes</p>
            <p>To: [HR] Samantha</p>
            <p>Subject: Request for overtime</p>
              <textarea class="message-box" readonly>Good day BraG,
I would kindly like to request to print xxxxxxxxx.
Regards,
T.Jakes
              </textarea>
            <div class="button-container">
              <button class="cancel-button">Reject</button>
              <button class="request-button">Approve</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ViewOvertimeRequests