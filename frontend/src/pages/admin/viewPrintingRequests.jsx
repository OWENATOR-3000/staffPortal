import React from 'react'
import Header from '../../components/header'
import '../../styles/printingrequest.css'
import AdminSidebar from '../../components/adminSidebar'
import SidebarNav from '../../components/sidebarNav'
import { useSelector } from 'react-redux'


function ViewPrintingrequest() {
  const position = useSelector((state)=> state.auth.position)
  return (
    <>
      <Header />
      <SidebarNav position={position}/>
      <div className='main-content'>
        <div className='head'>
          <form className='Printing_Request_Page'>
            <p>From: Tomy Jakes</p>
            <p>To: [Super Admin] Gerhardus</p>
            <p>Subject: Request to print</p>
              <textarea class="message-box" readonly>Good day BraG,
I would kindly like to request to print xxxxxxxxx.
Regards,
T.Jakes
              </textarea>
            <div class="button-container">
              <button class="cancel-button">Cancel</button>
              <button class="request-button">Request</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ViewPrintingrequest