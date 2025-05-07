import React, { useState } from 'react';
import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

function HRMisseddays() {
    const position = useSelector((state) => state.auth.position);
    const location = useLocation();
    const navigate = useNavigate();
    const { missedDay, employeeId, employeeName } = location.state || {};

    const [formData, setFormData] = useState({
        date: new Date(missedDay.date).toISOString().split('T')[0],
        clockinTime: missedDay.clockinTime || '',
        clockoutTime: missedDay.clockoutTime || '',
        reason: missedDay.reason || ''
    });

    if (!missedDay || !employeeId) {
        return <div>Error: Missed day or employee data not found.</div>;
    }

    const handleCancel = () => {
        navigate(-1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // First API: Update missed day
        const updateResponse = await fetch(`http://localhost:8080/updatemissedday/${missedDay.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clockinTime: formData.clockinTime,
                clockoutTime: formData.clockoutTime
            })
        });

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            console.error('Error updating missed day:', error);
            return;
        }

        // Second API: Insert missed day using employeeId from HRChosenemployee
        const insertResponse = await fetch('http://localhost:8080/misseddayinsert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employee_id: employeeId, // Use the employee ID here
                employee_name: employeeName,
                date: formData.date,
                clockinTime: formData.clockinTime,
                clockoutTime: formData.clockoutTime,
                reason: formData.reason
            })
        });

        if (!insertResponse.ok) {
            const error = await insertResponse.json();
            console.error('Error inserting missed day:', error);
            return;
        }

        // Optionally navigate or show a success message
        navigate(-1); // Replace with your desired navigation path
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className="misseddaycontent">
                <div id="misseddaysection">
                    <h4>Missed Day</h4>
                    <form onSubmit={handleSubmit}>
                        <p>Make changes to {employeeName || 'Employee'}'s missed day.</p>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Date:</td>
                                    <td>
                                        <input
                                            type='date'
                                            name='date'
                                            value={formData.date}
                                            onChange={handleChange}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Clock-in Time:</td>
                                    <td>
                                        <input
                                            type='text'
                                            name='clockinTime'
                                            placeholder='00:00'
                                            value={formData.clockinTime}
                                            onChange={handleChange}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Clock-out Time:</td>
                                    <td>
                                        <input
                                            type='text'
                                            name='clockoutTime'
                                            placeholder='00:00'
                                            value={formData.clockoutTime}
                                            onChange={handleChange}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Reason:</td>
                                    <td>
                                        <input
                                            type='text'
                                            name='reason'
                                            placeholder='XXXXXXX'
                                            value={formData.reason}
                                            onChange={handleChange}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <button className="missbuttons" id="miss1" type="submit">Confirm</button>
                        <button className="missbuttons" id="miss2" type="button" onClick={handleCancel}>Cancel</button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default HRMisseddays;