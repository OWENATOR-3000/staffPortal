import React, { useEffect, useState } from 'react';
import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import './style/index.css';
import defaulticon from './assets/defaulticon.png';

function HRChosenemployee() {
    const navigate = useNavigate();
    const position = useSelector((state) => state.auth.position);
    const location = useLocation();
    const { employee } = location.state || {};
    const userPermissions = useSelector((state) => state.auth.userPermissions);
    const today = new Date().toISOString().split('T')[0];

    if (!employee || !employee.id) {
        console.error('Employee data is missing or invalid');
        return <div>Error: Employee data not found.</div>;
    }

    const [editedEmployee, setEditedEmployee] = useState({
        id: employee.id,
        firstname: employee.Name,
        lastname: employee.Surname,
        ID_Number: employee.ID_Number,
        DOB: employee.DOB ? employee.DOB.split('T')[0] : '',
        Supervisor: employee.Supervisor || '',
        Gender: employee.Gender,
        nationality: employee.Nationality,
        languages: employee.Other_Languages || '',
        position: employee.Position,
    });

    const [data, setData] = useState([]);
    const [missedDays, setMissedDays] = useState([]); // State for missed days
    const [documents, setDocuments] = useState([]); // State for documents
    const [roles, setRoles] = useState([]); // State for roles
    const [clockinHistory, setClockinHistory] = useState([]); // State for clock-in history
    const [selectedDate, setSelectedDate] = useState(''); // State for selected date


    ////////////////////////////////////
        // Fetch documents for the employee
        useEffect(() => {
            const fetchRoles = async () => {
                try {
                    const res = await fetch(`http://localhost:8080/roles/${editedEmployee.id}`);
                    if (!res.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await res.json();
                    setRoles(data);
                } catch (err) {
                    console.error('Fetch roles error:', err);
                }
            };
    
            fetchRoles();
        }, [editedEmployee.id]); // Fetch roles when employee ID changes
    
    /////////////////////////////////////
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:8080/users');
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                setData(data);
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchData();
    }, []);

    // Fetch missed days for the employee
    useEffect(() => {
        const fetchMissedDays = async () => {
            try {
                const res = await fetch(`http://localhost:8080/employeemisseddays/${editedEmployee.id}`);
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                setMissedDays(data);
            } catch (err) {
                console.error('Fetch missed days error:', err);
            }
        };

        fetchMissedDays();
    }, [editedEmployee.id]); // Dependency array includes employee id

    // Fetch documents for the employee
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await fetch(`http://localhost:8080/getdocuments/${editedEmployee.id}`);
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                setDocuments(data);
            } catch (err) {
                console.error('Fetch documents error:', err);
            }
        };

        fetchDocuments();
    }, [editedEmployee.id]); // Fetch documents when employee ID changes

    // Fetch clock-in history for the employee using the specified API
    useEffect(() => {
        const fetchClockinHistory = async () => {
            try {
                const res = await fetch(`http://localhost:8080/clockin/${employee.id}`);
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                setClockinHistory(data);
            } catch (err) {
                console.error('Fetch clock-in history error:', err);
            }
        };

        fetchClockinHistory();
    }, [editedEmployee.id]); // Dependency array includes employee id


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedEmployee(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateEmployee = async () => {
        if (!editedEmployee.id) {
            console.error('Employee ID is undefined');
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/updateuser/${editedEmployee.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Name: editedEmployee.firstname,
                    Surname: editedEmployee.lastname,
                    ID_Number: editedEmployee.ID_Number,
                    DOB: editedEmployee.DOB,
                    Gender: editedEmployee.Gender,
                    Nationality: editedEmployee.nationality,
                    Supervisor: editedEmployee.Supervisor,
                    Home_Language: editedEmployee.languages,
                    Other_Languages: editedEmployee.languages,
                    Position: editedEmployee.position,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update employee');
            }
            const updatedEmployee = await res.json();
            setData(prevData => 
                prevData.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
            );
        } catch (err) {
            console.error('Update error:', err);
        }
        window.history.back();
    };

    const handleDeleteEmployee = async () => {
        if (!editedEmployee.id) {
            console.error('Employee ID is undefined');
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/deleteuser/${editedEmployee.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete employee');
            }
            setData(prevData => prevData.filter(emp => emp.id !== editedEmployee.id));
        } catch (err) {
            console.error('Delete error:', err);
        }
        window.history.back();
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    // Filter clock-in history based on selected date
    const filteredClockinHistory = selectedDate
        ? clockinHistory.filter(clockin => 
            new Date(clockin.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
        )
        : [];
    
        const handleClear = () => {
            setSelectedDate(''); // Clear the date input
        };
        
        const [isEditingDOB, setIsEditingDOB] = useState(false);

        const displayDOB = editedEmployee.DOB && !isEditingDOB
            ? new Date(new Date(editedEmployee.DOB).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : editedEmployee.DOB;
    
    
            const handleDateFocus = () => setIsEditingDOB(true);
            const handleDateBlur = () => setIsEditingDOB(false);
        

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div id="chosencontent">
                <div className="chosenemployee">
                    <div id="innerchosenemployee">
                        <table>
                            <thead>
                                <tr id="empimage">
                                    <td className='chosendetails'>Profile Picture:</td>
                                    <td id="imginner">
                                        <img 
                                            className="chosenimage" 
                                            src={`http://localhost:8080/staff/${editedEmployee.id}/profile-image` || defaulticon} 
                                            alt='Profile' 
                                            onError={(e) => { e.target.src = defaulticon; }} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Name:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="firstname" 
                                            value={editedEmployee.firstname} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Surname:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="lastname" 
                                            value={editedEmployee.lastname} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Supervisor:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="Supervisor" 
                                            value={editedEmployee.Supervisor} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>ID Number:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="ID_Number" 
                                            value={editedEmployee.ID_Number} 
                                            onChange={handleInputChange}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Date of Birth:</td>
                                    <td>
                                    <input  className='choseninput'
                                        type="date" 
                                        name="DOB" 
                                        value={displayDOB} 
                                        onChange={handleInputChange} 
                                        max={today}
                                        onFocus={handleDateFocus}
                                        onBlur={handleDateBlur}
                                       />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Gender:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="Gender" 
                                            value={editedEmployee.Gender} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Nationality:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="nationality" 
                                            value={editedEmployee.nationality} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Language:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="languages" 
                                            value={editedEmployee.languages} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Position:</td>
                                    <td>
                                        <input  className='choseninput'
                                            type="text" 
                                            name="position" 
                                            value={editedEmployee.position} 
                                            onChange={handleInputChange} 
                                        />
                                    </td>
                                </tr>
                            </thead>
                        </table>
                        {userPermissions.includes(5) && (
                        <button id="editbutton" onClick={handleUpdateEmployee}>Update Profile</button>
                        )}
                           {userPermissions.includes(6) && (
                        <button id="deletebutton" onClick={handleDeleteEmployee}>Delete</button>
                           )}
                    </div>
                </div>
                <div id="chosenbelongingssection">
                {userPermissions.includes(7) && (
                    <div id="chosenclockinsection">
                        <h4>Clock-in History</h4>
                        <input type='date' onChange={handleDateChange} />
                        <button onClick={handleClear}>Clear</button>
                        <div id="chosenclocktablediv">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Clock-in Time</th>
                                        <th>Clock-out Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedDate ? filteredClockinHistory : clockinHistory).length > 0 ? (
                                        (selectedDate ? filteredClockinHistory : clockinHistory).map((clockin) => (
                                            <tr key={clockin.id}>
                                            <td>{new Date(clockin.date).toLocaleDateString()}</td>
                                            <td>{clockin.clockinTime || '----'}</td>
                                            <td>{clockin.clockoutTime || '----'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                            <tr>
                                                <td colSpan="3">No clock-in records found.</td>
                                            </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                 {userPermissions.includes(8) && (
               <div 
               id="chosendocuments" 
               style={!userPermissions.includes(7) ? { marginTop: '4rem' } : {}}
           >
                        <div id="doctitle">
                            <h4>Documents</h4>
                        </div>
                        <div id="doccontent">
                            <ul>
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <li key={doc.id}>
                                            <a href={`http://localhost:8080/download/${doc.id}`} target="_blank" rel="noopener noreferrer">
                                                {doc.file_name} {/* You can replace this with any string or document title */}
                                            </a>
                                        </li>
                                    ))
                                ) : (
                                    <li>No documents found.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                 )}
                  {userPermissions.includes(9) && (
                    <div id="chosenmissedsection"
                    style={!userPermissions.includes(7) && !userPermissions.includes(8) ? { marginTop: '4rem' } : {}}
                    >
                        <h4>Days Missed</h4>
                        <table id="missedtable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Clock-in Time</th>
                                    <th>Clock-out Time</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {missedDays.length > 0 ? (
                                    missedDays.map((day) => (
                                        <tr key={day.id}>
                                            <td>{new Date(day.date).toLocaleDateString()}</td>
                                            <td>{day.clockinTime || '----'}</td>
                                            <td>{day.clockoutTime || '----'}</td>
                                            <td>
                                            {userPermissions.includes(10) && (
                                                <button onClick={() => navigate('/hrmisseddays', { state: { missedDay: day, employeeId: editedEmployee.id, employeeName: `${editedEmployee.firstname} ${editedEmployee.lastname}` } })}>
                                                    Edit
                                                </button>
                                            )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">No missed days found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                  )}
                </div>
            </div>
        </>
    );
}

export default HRChosenemployee;
