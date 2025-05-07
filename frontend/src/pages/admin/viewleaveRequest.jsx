import React from 'react'
import AdminSidebar from '../../components/adminSidebar'
import Header from '../../components/header'
import '../../styles/leaverequest.css'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import SidebarNav from '../../components/sidebarNav'

function ViewLeaveRequest() {
  const position = useSelector((state)=> state.auth.position)

  const [form, setForm] = useState({
    date:'',
    name:'',
    position:'',
    department:'',
    period:'',
    leaverequests:{
      personal: { remainingAllocation: '', taken: '', remaining: '', remarks: '' },
      sick: { remainingAllocation: '', taken: '', remaining: '', remarks: '' },
      planned: { remainingAllocation: '', taken: '', remaining: '', remarks: '' },
      vacation: { remainingAllocation: '', taken: '', remaining: '', remarks: '' },
      maternity: { remainingAllocation: '', taken: '', remaining: '', remarks: '' },
      other: { remainingAllocation: '', taken: '', remaining: '', remarks: '' },
    },
    leaveDetails:{
      startDate:'',
      endDate:'',
      totalDays:'',
      resumingWorkDay:'',
      remarks:'',
    },
    emergencyContact:{
      name:'',
      address:'',
      phone:'',
    },
  })
  
  const handleInputChange = (section, field,value)=>{
    setForm((prevState) => ({
      ...prevState,
      [section]: {
        ...prevState[section],
        [field]: value,
      },
    }))
  }

  const handleLeaveRequestChange = (type,field,value) => {
    setForm((prevState)=>({
      // ...prevState,
      // leaveRequests:{
      //   ...prevState.leaveRequests,
      //   [type]: {
      //     ...prevState.leaveRequests[type],
      //     [field]: value,
      //   },
      // },
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', form);
  };

  return (
    <>
    <div className='contain'>
      <Header />
      <SidebarNav position={position} />
        <div className='main-content'>
          <div className='head'>
            <form className='leave_request_form' onSubmit={handleSubmit}>
              <h2>Leave Application form</h2>
              {/* Date,Name and others */}
                <table>
                  <tr>
                    <td>Date:</td>
                    <td><input type="date" name="date" value={form.date} onChange={(e) => handleInputChange('form','date',e.target.value)}/></td>
                  </tr>
                  <tr>
                    <td>Name:</td>
                    <td><input type="text" name="name" value={form.name} onChange={(e) => handleInputChange('form','name',e.target.value)}/></td>
                  </tr>
                  <tr>
                    <td>Position:</td>
                    <td><input type="text" name="position" value={form.position} onChange={(e) => handleInputChange('from','position',e.target.value)}/></td>
                  </tr>
                  <tr>
                    <td>Department:</td>
                    <td><input type="text" name="department" value={form.department} onChange={(e) => handleInputChange('from','department',e.target.value)}/></td>
                  </tr>
                  <tr>
                    <td>Period:</td>
                    <td><input type="text" name="period" value={form.period} onChange={(e) => handleInputChange('from','period',e.target.value)}/></td>
                  </tr>
                </table>
              {/* Leave Request*/}
              <h3>Leave Request</h3>
        <table>
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Remaining Allocation</th>
              <th>Taken</th>
              <th>Remaining</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="checkbox" className="leave-type" /> Personal</td>
              <td><input type="number" name="personal_remaining_allocation"/></td>
              <td><input type="number" name="personal_taken"/></td>
              <td><input type="number" name="personal_remaining"/></td>
              <td><input type="text" name="personal_remarks"/></td>
            </tr>
            <tr>
              <td><input type="checkbox" className="leave-type"/> Sick</td>
              <td><input type="number" name="sick_remaining_allocation"/></td>
              <td><input type="number" name="sick_taken"/></td>
              <td><input type="number" name="sick_remaining"/></td>
              <td><input type="text" name="sick_remarks"/></td>
            </tr>
            <tr>
              <td><input type="checkbox" className="leave-type"/> Planned</td>
              <td><input type="number" name="planned_remaining_allocation"/></td>
              <td><input type="number" name="planned_taken"/></td>
              <td><input type="number" name="planned_remaining"/></td>
              <td><input type="text" name="planned_remarks"/></td>
            </tr>
            <tr>
              <td><input type="checkbox" className="leave-type"/> Vacation</td>
              <td><input type="number" name="vacation_remaining_allocation"/></td>
              <td><input type="number" name="vacation_taken"/></td>
              <td><input type="number" name="vacation_remaining"/></td>
              <td><input type="text" name="vacation_remarks"/></td>
            </tr>
            <tr>
              <td><input type="checkbox" className="leave-type"/> Maternity</td>
              <td><input type="number" name="maternity_remaining_allocation"/></td>
              <td><input type="number" name="maternity_taken"/></td>
              <td><input type="number" name="maternity_remaining"/></td>
              <td><input type="text" name="maternity_remarks"/></td>
            </tr>
            <tr>
              <td><input type="checkbox" className="leave-type"/> Other:</td>
              <td><input type="number" name="other_remaining_allocation"/></td>
              <td><input type="number" name="other_taken"/></td>
              <td><input type="number" name="other_remaining"/></td>
              <td><input type="text" name="other_remarks"/></td>
            </tr>
          </tbody>
        </table>
        {/*leave Details*/}
        <h3>Leave Details</h3>
        <table>
            <tr>
                <td>Start Date:</td>
                <td><input type="date" name="start_date"/></td>
            </tr>
            <tr>
                <td>End Date:</td>
                <td><input type="date" name="end_date"/></td>
            </tr>
            <tr>
                <td>Total Days:</td>
                <td><input type="number" name="total_days"/></td>
            </tr>
            <tr>
                <td>Resuming Work Day:</td>
                <td><input type="date" name="resuming_work_day"/></td>
            </tr>
            <tr>
                <td>Remarks:</td>
                <td><input type="text" name="leave_remarks"/></td>
            </tr>
        </table>
        {/**emergency contact */}
        <h3>Emergency Contact</h3>
        <table>
            <tr>
                <td>Name:</td>
                <td><input type="text" name="emergency_name"/></td>
            </tr>
            <tr>
                <td>Address:</td>
                <td><input type="text" name="emergency_address"/></td>
            </tr>
            <tr>
                <td>Phone Number:</td>
                <td><input type="text" name="emergency_phone"/></td>
            </tr>
        </table>

        <div className="signature">
            <div>
                <p>Employee Signature:</p>
                <p>___________________________ Date: _________________</p>
            </div>
            <div>
                <p>HR Signature:</p>
                <p>___________________________ Date: _________________</p>
            </div>
        </div>

        <div className="instructions">
            <h4>How to Submit Leave Permission</h4>
            <ol>
                <li>Employee has to submit leave application form at least 14 days prior to leave taken.</li>
                <li>Leave application must be verified by HR.</li>
                <li>Verified application will be taken to direct superior.</li>
                <li>The original application will be given back to HR. Employee will be given a copy.</li>
            </ol>
        </div>
            </form>
<div className='button-container'>
            <button className='btnApprove'>Approve</button>
            <button className='btnReject'>Reject</button>
            </div>
            
          </div>  
        </div>
    </div>
    </>
  )
}

export default ViewLeaveRequest