import SidebarNav from './sidebarNav.jsx';
import Header from './header.jsx';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import '../styles/Setpayroll.css';
import { useNavigate } from 'react-router-dom';

function Setpayroll() {
    const navigate = useNavigate();
    const position = useSelector((state) => state.auth.position);

    // State to hold form data
    const [formData, setFormData] = useState({
        employee_id: '',
        Name: '',
        Surname: '',
        Position: '',
        regular_rate: '',
        overtime_rate: '',
        gross_pay: ''
    });

    // State to hold users data, payroll records, and error
    const [users, setUsers] = useState([]);
    const [payrollRecords, setPayrollRecords] = useState([]);
    const [error, setError] = useState('');

    // Fetch users and payroll records on component mount
    useEffect(() => {
        const fetchUsersAndPayroll = async () => {
            try {
                const [usersResponse, payrollResponse] = await Promise.all([
                    fetch('http://localhost:8080/users'),
                    fetch('http://localhost:8080/hrpayroll')
                ]);

                const usersData = await usersResponse.json();
                const payrollData = await payrollResponse.json();

                // Extract employee IDs with payroll records
                const employeeIdsWithPayroll = payrollData.map(record => record.employee_id);
                setPayrollRecords(employeeIdsWithPayroll);

                // Filter users without payroll records
                const usersWithoutPayroll = usersData.filter(
                    user => !employeeIdsWithPayroll.includes(user.id)
                );

                setUsers(usersWithoutPayroll);
            } catch (error) {
                console.error('Error fetching users or payroll records:', error);
                setError('Failed to load data');
            }
        };

        fetchUsersAndPayroll();
    }, []);

    // Handle input changes for non-employee fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handle employee selection from dropdown
    const handleUserSelect = (e) => {
        const selectedUser = users.find(user => user.id.toString() === e.target.value);
        if (selectedUser) {
            setFormData({
                ...formData,
                employee_id: selectedUser.id,
                Name: selectedUser.Name,
                Surname: selectedUser.Surname,
                Position: selectedUser.Position
            });
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Check if the selected employee already has a payroll record
        if (payrollRecords.includes(formData.employee_id)) {
            setError('This employee already has a payroll record.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/setpayroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Specify the content type
                },
                body: JSON.stringify(formData), // Convert form data to JSON
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error creating payroll');
            }

            const data = await response.json(); // Parse the response data
            console.log('Payroll created:', data); // Handle success response
            navigate(-1); // Navigate to the previous page upon success
        } catch (err) {
            console.error('Error creating payroll:', err); // Handle error response
            setError(err.message); // Set error message to state
        }
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className="setnewpayroll">
                <div id="setnewpayrollinner">
                    <h3>Create New Payroll</h3>
                    {error && <p className="error">{error}</p>} {/* Display error message */}
                    <form onSubmit={handleSubmit}>
                        <div className="setnewpayformdiv">
                            <p>Select Employee</p>
                            <select
                                id="employee_select"
                                name="employee_select"
                                onChange={handleUserSelect}
                                required
                            >
                                <option value="">Select an Employee</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.Name} {user.Surname}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Employee ID</p>
                            <input
                                type="text"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleChange}
                                readOnly
                                required
                            />
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Employee Name</p>
                            <input
                                type="text"
                                name="Name"
                                value={formData.Name}
                                onChange={handleChange}
                                readOnly
                                required
                            />
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Employee Surname</p>
                            <input
                                type="text"
                                name="Surname"
                                value={formData.Surname}
                                onChange={handleChange}
                                readOnly
                                required
                            />
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Employee Position</p>
                            <input
                                type="text"
                                name="Position"
                                value={formData.Position}
                                onChange={handleChange}
                                readOnly
                                required
                            />
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Regular Rate (%)</p>
                            <input
                                type="number"
                                name="regular_rate"
                                value={formData.regular_rate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Overtime Rate (%)</p>
                            <input
                                type="number"
                                name="overtime_rate"
                                value={formData.overtime_rate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="setnewpayformdiv">
                            <p>Gross Rate (%)</p>
                            <input
                                type="number"
                                name="gross_pay"
                                value={formData.gross_pay}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <br />
                        <button type="button" onClick={() => navigate(-1)} id="payrollcancel">Cancel</button>
                        <button type="submit" id="payrollsubmit">Submit</button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Setpayroll;
