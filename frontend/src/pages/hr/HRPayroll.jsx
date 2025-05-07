import React, { useEffect, useState } from 'react';
import HRheader from "./HRheader";
import './style/index.css';
import Header from '../../components/header';
import SidebarNav from '../../components/sidebarNav';
import { useSelector } from 'react-redux';
import plus from './assets/plus.png'
import { useNavigate } from 'react-router-dom';

function HRPayroll() {
    const navigate = useNavigate();
    const position = useSelector((state) => state.auth.position);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [editedValues, setEditedValues] = useState({}); // State for edited values
    const userPermissions = useSelector((state) => state.auth.userPermissions);

    useEffect(() => {
        fetch('http://localhost:8080/hrpayroll') // Update this to your actual endpoint
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                setEmployees(data);
                setLoading(false); // Set loading to false after fetching data
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setError(err.message);
                setLoading(false); // Set loading to false even on error
            });
    }, []);

    const handleRowClick = (employee) => {
        setSelectedEmployee(employee); // Set the selected employee
        setEditedValues({ // Initialize edited values with the selected employee's data
            Name: employee.Name,
            Surname: employee.Surname,
            Position: employee.Position,
            regular_rate: employee.regular_rate,
            overtime_rate: employee.overtime_rate,
            gross_pay: employee.gross_pay
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedValues(prevValues => ({
            ...prevValues,
            [name]: value // Update the corresponding field in edited values
        }));
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/updatepayroll/${selectedEmployee.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedValues), // Send updated values
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const updatedEmployee = await response.json();
            setEmployees(prevEmployees =>
                prevEmployees.map(emp =>
                    emp.id === updatedEmployee.id ? { ...emp, ...editedValues } : emp
                )

            );
            setSelectedEmployee(updatedEmployee); // Update the selected employee with new data

        } catch (err) {
            console.error('Error updating payroll:', err);
            setError(err.message);
        }
        window.location.reload();
    };

    const handleCancel = () => {
        // Revert to the original selected employee values
        if (selectedEmployee) {
            setEditedValues({
                Name: selectedEmployee.Name,
                Surname: selectedEmployee.Surname,
                Position: selectedEmployee.Position,
                regular_rate: selectedEmployee.regular_rate,
                overtime_rate: selectedEmployee.overtime_rate,
                gross_pay: selectedEmployee.gross_pay
            });
        }
        window.location.reload();
    };

    const filteredPayrollInfo = selectedEmployee
        ? employees.filter(emp => emp.id === selectedEmployee.id) // Assuming each employee has a unique `id`
        : [];

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className='maincontent'>
                <div id="hrpayrolldiv">
                    <h4>Staff Payroll</h4>
                    <div id="hrpayroll">
                        <table id="payrollemployees">
                            <tbody>
                                {employees.length === 0 ? (
                                    <tr>
                                        <td>No employees found.</td>
                                    </tr>
                                ) : (
                                    employees.map((employee, index) => (
                                        <tr key={index} onClick={() => handleRowClick(employee)}>
                                            <td>{employee.Name} {employee.Surname}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div id="hrpayinfo">
                            <table id="hrpayrollinfo">
                                <thead>
                                    <tr>
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th>Position</th>
                                        <th>Regular Rate</th>
                                        <th>Overtime Rate</th>
                                        <th>Gross Pay</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6">Loading...</td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="6">Error: {error}</td>
                                        </tr>
                                    ) : filteredPayrollInfo.length === 0 ? (
                                        <tr>
                                            <td colSpan="6">Select an employee to view payroll info.</td>
                                        </tr>
                                    ) : (
                                        filteredPayrollInfo.map((d, i) => (
                                            <tr key={i}>
                                                <td><input type='text' name='Name' value={editedValues.Name} onChange={handleInputChange} /></td>
                                                <td><input type='text' name='Surname' value={editedValues.Surname} onChange={handleInputChange} /></td>
                                                <td><input type='text' name='Position' value={editedValues.Position} onChange={handleInputChange} /></td>
                                                <td><input type='number' name='regular_rate' value={editedValues.regular_rate || ''} onChange={handleInputChange} /></td>
                                                <td><input type='number' name='overtime_rate' value={editedValues.overtime_rate || ''} onChange={handleInputChange} /></td>
                                                <td><input type='number' name='gross_pay' value={editedValues.gross_pay || ''} onChange={handleInputChange} /></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {selectedEmployee && userPermissions.includes(20) && ( // Show buttons only if an employee is selected
                                <div id="payrolleditdiv">
                                    <button id="editpayrollcancel" onClick={handleCancel}>Cancel</button>
                                    <button id="editpayrollsubmit" onClick={handleSubmit}>Change</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {userPermissions.includes(21) && (
                    <div id="newpayroll" onClick={event => navigate('/setpayroll')}>
                        <img src={plus} alt="Add new payroll" />
                        <p>Create New Payroll</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default HRPayroll;
