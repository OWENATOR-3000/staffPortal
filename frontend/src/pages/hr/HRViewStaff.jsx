import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import '../../styles/StaffProfiles.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HRViewStaffProfiles = () => {
  const [staffList, setStaffList] = useState([]); 
  const [selectedStaff, setSelectedStaff] = useState({});
  const [isEditing] = useState(false);

  // Fetch staff data from the database
  const fetchStaffData = async () => {
    try {
      const response = await fetch('http://localhost:8080/users'); 
      const data = await response.json();
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  useEffect(() => {
    fetchStaffData(); 
  }, []);

  
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate('/editStaffInfo', {state: {selectedStaff} });
  };

  const position = useSelector((state)=> state.auth.position)

  return (
    <>
    <Header />
      <SidebarNav position={position} />
      <div className="staff-profiles-container">
        <header className="header">
          <h1>Staff Profiles</h1>
        </header>

        <div className="content-container">
          <div className="staff-list">
            <ul>
              {staffList.map((staff) => (
                <li
                  key={staff.Id} 
                  className={staff.Id === selectedStaff.Id ? 'selected' : ''}
                  onClick={() => setSelectedStaff(staff)}
                >
                  {staff.Name} {/* Assuming Name is the field to display */}
                </li>
              ))}
            </ul>
          </div>

          <div className="profile-card">
            {selectedStaff.Id ? (
              <>
                <div className="profile-picture">
                  {<img src={`http://localhost:8080/staff/${selectedStaff.Id}/profile-image`} alt="Profile" onError={(e) => { e.target.src = '/default-image.jpg'; }} />}
                </div>

                <div className="profile-details">
                  {isEditing ? (
                    <>
                      <p><strong>Name:</strong> <input value={selectedStaff.Name} onChange={(e) => setSelectedStaff({ ...selectedStaff, Name: e.target.value })} /></p>
                      <p><strong>Surname:</strong> <input value={selectedStaff.Surname} onChange={(e) => setSelectedStaff({ ...selectedStaff, Surname: e.target.value })} /></p>
                      <p><strong>ID Number:</strong> <input value={selectedStaff.ID_Number} onChange={(e) => setSelectedStaff({ ...selectedStaff, ID_Number: e.target.value })} /></p>
                      <p><strong>Date of Birth:</strong> <input value={selectedStaff.DOB} onChange={(e) => setSelectedStaff({ ...selectedStaff, DOB: e.target.value })} /></p>
                      <p><strong>Nationality:</strong> <input value={selectedStaff.Nationality} onChange={(e) => setSelectedStaff({ ...selectedStaff, Nationality: e.target.value })} /></p>
                      <p><strong>Home Language:</strong> <input value={selectedStaff.Home_Language} onChange={(e) => setSelectedStaff({ ...selectedStaff, Home_Language: e.target.value })} /></p>
                      <p><strong>Other Languages:</strong> <input value={selectedStaff.Other_Languages} onChange={(e) => setSelectedStaff({ ...selectedStaff, Other_Languages: e.target.value })} /></p>
                      <p><strong>Position:</strong> <input value={selectedStaff.Position} onChange={(e) => setSelectedStaff({ ...selectedStaff, Position: e.target.value })} /></p>
                    </>
                  ) : (
                    <>
                      <p><strong>Name:</strong> <span>{selectedStaff.Name}</span></p>
                      <p><strong>Surname:</strong> <span>{selectedStaff.Surname}</span></p>
                      <p><strong>ID Number:</strong> <span>{selectedStaff.ID_Number}</span></p>
                      <p><strong>Date of Birth:</strong> <span>{selectedStaff.DOB}</span></p>
                      <p><strong>Nationality:</strong> <span>{selectedStaff.Nationality}</span></p>
                      <p><strong>Home Language:</strong> <span>{selectedStaff.Home_Language}</span></p>
                      <p><strong>Other Languages:</strong> <span>{selectedStaff.Other_Languages}</span></p>
                      <p><strong>Position:</strong> <span>{selectedStaff.Position}</span></p>
                    </>
                  )}
                </div>

                <button 
                className="edit-btn" onClick={handleEditClick}>Edit
                </button>
              </>
            ) : (
              <p>No profile selected</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HRViewStaffProfiles;
