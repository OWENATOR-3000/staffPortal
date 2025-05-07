import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SidebarNav from '../../components/sidebarNav';
import Header from '../../components/header';
import { createPrintingRequest } from '../../printingSlice';
import '../../styles/printingrequest.css';

function PrintingrequestPage() {
  const userDetails = useSelector((state) => state.auth.data[0]);
  const position = userDetails?.Position;
  const [name, setName] = useState(`${userDetails?.Name} ${userDetails?.Surname}`);
  const [email, setEmail] = useState(''); // Email manually entered by user
  const [type, setType] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && type && email && date) {
      const employee_id = userDetails?.id; // Assuming employee_id exists in userDetails
      
      dispatch(createPrintingRequest({ employee_id, name, type, email, date }))
        .then(() => {
          setSuccessMessage('Request sent successfully!'); // Set success message
          // Reset form fields after submission
          setType('');
          setEmail('');
          // Optionally, reset the date to today's date
          setDate(new Date().toISOString().split('T')[0]);
        })
        .catch((error) => {
          alert('Failed to send printing request: ' + error);
        });
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <>
      <Header />
      <SidebarNav position={position} />
      <div className='main-content'>
        <div className='head'>
          <form className='Printing_Request_Page' onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">From:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                readOnly
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Set user-entered email
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="type">Request Type:</label>
              <select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="Weekly Report">Weekly Report</option>
                <option value="Monthly Report">Monthly Report</option>
                <option value="Fulltime Report">Fulltime Report</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="date">Date:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={date}
                readOnly
              />
            </div>
            <div className="button-container">
              <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="request-button">
                Send
              </button>
            </div>
            <div style={{ textAlign: "center" }}> {/* Corrected inline style */}
              {successMessage && <p style={{ color: "green" }}>{successMessage}</p>} {/* Display success message */}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default PrintingrequestPage;
