import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ChangeStaffInfo() {
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editedStaff, setEditedStaff] = useState({ id: '', name: '', surname: '', position: '' });

    useEffect(() => {
        fetch('http://localhost:8080/api/staff')
            .then(response => response.json())
            .then(data => {
                console.log('Fetched staff data:', data); // Check if data is populated
                setStaffList(data);
            })
            .catch(error => console.error('Error fetching staff:', error));
    }, []);

    const handleEdit = (index) => {
        setEditingIndex(index);
        setEditedStaff({
            id: staffList[index].Id, 
            name: staffList[index].Name,
            surname: staffList[index].Surname,
            position: staffList[index].Position
        });
    };

    const handleChange = (e) => {
        setEditedStaff({ ...editedStaff, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/staff/${editedStaff.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editedStaff.Name,
                    surname: editedStaff.Surname,
                    id_number: editedStaff.ID_Number,
                    position: editedStaff.position,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update staff information');
            }

            // Update staff list in the state
            const updatedStaffList = [...staffList];
            updatedStaffList[editingIndex] = { Id: editedStaff.id, Name: editedStaff.name, Surname: editedStaff.surname, Position: editedStaff.position };
            setStaffList(updatedStaffList);
            setEditingIndex(null);
        } catch (error) {
            console.error('Error updating staff:', error);
        }
    };

    const handleDelete = (index) => {
        const updatedStaffList = staffList.filter((_, i) => i !== index);
        setStaffList(updatedStaffList);
    };

    const handleSave = () => {
        navigate("/staffProfiles");
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px'
    };

    const thTdStyle = {
        border: '1px solid #ddd',
        padding: '12px',
        textAlign: 'left'
    };

    const thStyle = {
        ...thTdStyle,
        backgroundColor: '#f2f2f2'
    };

    const btnStyle = {
        padding: '6px 12px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '4px'
    };

    const btnEditStyle = {
        ...btnStyle,
        backgroundColor: '#007bff',
        color: 'white'
    };

    const btnDeleteStyle = {
        ...btnStyle,
        backgroundColor: '#dc3545',
        color: 'white'
    };

    const btnSaveStyle = {
        ...btnStyle,
        backgroundColor: '#28a745',
        color: 'white',
        marginTop: '20px'
    };

    return (
        <div style={{ marginLeft: '250px', padding: '20px' }}>
            <h1>Change Staff Information</h1>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Surname</th>
                        <th style={thStyle}>Position</th>
                        <th style={thStyle} colSpan="2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {staffList.length > 0 ? (
                        staffList.map((staff, index) => (
                            <tr key={staff.Id}> {/* Use the Id as the key */}
                                {editingIndex === index ? (
                                    <>
                                        <td style={thTdStyle}>
                                            <input
                                                type="text"
                                                name="name"
                                                value={editedStaff.name} // Access 'name' correctly
                                                onChange={handleChange}
                                            />
                                        </td>
                                        <td style={thTdStyle}>
                                            <input
                                                type="text"
                                                name="surname"
                                                value={editedStaff.surname} // Access 'surname' correctly
                                                onChange={handleChange}
                                            />
                                        </td>
                                        <td style={thTdStyle}>
                                            <input
                                                type="text"
                                                name="position"
                                                value={editedStaff.position} // Access 'position' correctly
                                                onChange={handleChange}
                                            />
                                        </td>
                                        <td style={thTdStyle} colSpan="2">
                                            <button style={btnSaveStyle} onClick={handleSaveEdit}>
                                                Save
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={thTdStyle}>{staff.Name}</td>
                                        <td style={thTdStyle}>{staff.Surname}</td>
                                        <td style={thTdStyle}>{staff.Position}</td>
                                        <td style={thTdStyle}>
                                            <button style={btnEditStyle} onClick={() => handleEdit(index)}>
                                                Edit
                                            </button>
                                        </td>
                                        <td style={thTdStyle}>
                                            <button style={btnDeleteStyle} onClick={() => handleDelete(index)}>
                                                Delete
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">No staff information found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <button style={btnSaveStyle} onClick={handleSave}>Save</button>
        </div>
    );
}

export default ChangeStaffInfo;
