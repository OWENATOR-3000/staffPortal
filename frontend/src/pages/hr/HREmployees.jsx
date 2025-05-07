import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import './style/index.css';
import search from './assets/searchicon.png';
import propic2 from './assets/defaultpropic.png';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

function HREmployees() {
    const position = useSelector((state) => state.auth.position);
    const [data, setData] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editedEmployee, setEditedEmployee] = useState({
        firstname: '',
        lastname: '',
        id_number: '',
        DOB: '',
        Supervisor: '',
        Gender: '',
        nationality: '',
        languages: '',
        position: '',
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await fetch('http://localhost:8080/users');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setData(data);
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };

        fetchEmployees();
    }, []);

    const handleRowClick = (employee) => {
        setSelectedEmployee(employee);
        setEditedEmployee({
            firstname: employee.Name,
            lastname: employee.Surname,
            Supervisor: employee.Supervisor,
            ID_Number: employee.ID_Number, // Ensure correct mapping
            DOB: employee.DOB ? employee.DOB.split('T')[0] : '', // Format to YYYY-MM-DD
            Gender: employee.Gender,
            nationality: employee.Nationality,
            languages: employee.Other_Languages,
            position: employee.Position,
        });
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedEmployee((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateEmployee = async () => {
        try {
            const response = await fetch(`http://localhost:8080/users/${selectedEmployee.id}`, { // Use selectedEmployee.id
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedEmployee),
            });

            if (!response.ok) {
                throw new Error('Failed to update employee');
            }

            const updatedEmployee = await response.json();
            setData((prevData) =>
                prevData.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
            );
            setSelectedEmployee(updatedEmployee);
            setEditedEmployee(updatedEmployee);
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleDeleteEmployee = async () => {
        if (!selectedEmployee) return;

        try {
            const response = await fetch(`http://localhost:8080/users/${selectedEmployee.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete employee');
            }

            setData((prevData) => prevData.filter((emp) => emp.id !== selectedEmployee.id));
            setSelectedEmployee(null);
            setEditedEmployee({
                firstname: '',
                lastname: '',
                ID_Number: '',
                Supervisor: '',
                DOB: '',
                Gender: '',
                nationality: '',
                languages: '',
                position: '',
            });
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const filteredData = data.filter((employee) =>
        [employee.Name, employee.Surname, employee.Supervisor, employee.Position].some((field) =>
            field.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className='viewemployees'>
                <div className='employeesearch'>
                    <img className='searchicon' src={search} alt="Search" />
                    <input
                        type="text"
                        placeholder='Search'
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className='employeecontents'>
                    <table className='employeestable'>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Position</th>
                                <th>Supervisor</th>
                                <th>Clock-In Time</th>
                                <th>Clock-Out Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="6">No employees found.</td>
                                </tr>
                            ) : (
                                filteredData.map((d, i) => (
                                    <tr key={i} onClick={() => handleRowClick(d)}>
                                        <td>{d.Name}</td>
                                        <td>{d.Surname}</td>
                                        <td>{d.Position}</td>
                                        <td>{d.Supervisor || 'N/A'}</td>
                                        <td>{d.ClockInTime || 'N/A'}</td>
                                        <td>{d.ClockOutTime || 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className='chosenemployee'>
                        <img className='chosenimage' src={propic2} alt='Loading...' />
                        <table>
                            <thead>
                                <tr>
                                    <td className='chosendetails'>Name:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="firstname"
                                                value={editedEmployee.firstname}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Surname:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="lastname"
                                                value={editedEmployee.lastname}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Supervisor:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="Supervisor"
                                                value={editedEmployee.Supervisor}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>ID Number:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="ID_Number"
                                                value={editedEmployee.ID_Number}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Date of Birth:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="date"
                                                name="DOB"
                                                value={editedEmployee.DOB}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Gender:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="Gender"
                                                value={editedEmployee.Gender}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Nationality:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="nationality"
                                                value={editedEmployee.nationality}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Language:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="languages"
                                                value={editedEmployee.languages}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className='chosendetails'>Position:</td>
                                    <td>
                                        {selectedEmployee ? (
                                            <input
                                                type="text"
                                                name="position"
                                                value={editedEmployee.position}
                                                onChange={handleInputChange}
                                            />
                                        ) : '-----'}
                                    </td>
                                </tr>
                            </thead>
                        </table>
                        {selectedEmployee && (
                            <>
                                <button id="editbutton" onClick={handleUpdateEmployee}>Update Profile</button>
                                <button id="deletebutton" onClick={handleDeleteEmployee}>Delete</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default HREmployees;
