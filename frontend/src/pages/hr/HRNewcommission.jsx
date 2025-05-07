import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/index.css';

function HRNewCommission() {
    const position = useSelector((state) => state.auth.position);
    const navigate = useNavigate();

    // State to hold form inputs
    const [formData, setFormData] = useState({
        employee_id: '',
        employee_name: '',
        employee_surname: '',
        item_name: '',
        sale_type: '',
        product_cost: '',
        vat: '',
        commission: '',
        date: ''
    });

    // State to hold users data
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    // Fetch users from API
    useEffect(() => {
        fetch('http://localhost:8080/users') // Adjust to your API URL if different
            .then((response) => response.json())
            .then((data) => setUsers(data))
            .catch((error) => console.error('Error fetching users:', error));
    }, []);

    // Handle input change for non-employee fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle employee selection from dropdown
    const handleUserSelect = (e) => {
        const selectedUser = users.find(user => user.id.toString() === e.target.value);
        if (selectedUser) {
            setFormData({
                ...formData,
                employee_id: selectedUser.id,
                employee_name: selectedUser.Name,
                employee_surname: selectedUser.Surname
            });
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        fetch('http://localhost:8080/addcommission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(data => {
            console.log('Commission added successfully:', data);
            setFormData({
                employee_id: '',
                employee_name: '',
                employee_surname: '',
                item_name: '',
                sale_type: '',
                product_cost: '',
                vat: '',
                commission: '',
                date: ''
            });
            navigate(-1); // Navigate back on successful submission
        })
        .catch(err => {
            console.error('Fetch error:', err);
            setError(err.message); // Set error message to state
        });
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className='main-content'>
                <div className="newcommission">
                    <h2>New Commission Entry</h2>
                    {error && <p className="error">{error}</p>} {/* Display error message */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="employee_select">Select Employee</label>
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

                        <div className="form-group">
                            <label htmlFor="employee_id">Employee ID</label>
                            <input
                                type="text"
                                id="employee_id"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleChange}
                                readOnly
                                required
                            />
                        </div>

                        <div id="commissiondetailform1">
                            <div className="form-group">
                                <label htmlFor="employee_name">Employee Name</label>
                                <input
                                    type="text"
                                    id="employee_name"
                                    name="employee_name"
                                    value={formData.employee_name}
                                    onChange={handleChange}
                                    readOnly
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    id="employee_surname"
                                    name="employee_surname"
                                    value={formData.employee_surname}
                                    onChange={handleChange}
                                    readOnly
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="item_name">Item Name</label>
                            <input
                                type="text"
                                id="item_name"
                                name="item_name"
                                value={formData.item_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sale_type">Sale Type</label>
                            <input
                                type="text"
                                id="sale_type"
                                name="sale_type"
                                value={formData.sale_type}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="product_cost">Product Cost</label>
                            <input
                                type="number"
                                id="product_cost"
                                name="product_cost"
                                value={formData.product_cost}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="vat">VAT (%)</label>
                            <input
                                type="number"
                                id="vat"
                                name="vat"
                                value={formData.vat}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="commission">Commission</label>
                            <input
                                type="number"
                                id="commission"
                                name="commission"
                                value={formData.commission}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div id="buttonsec">
                            <button type="submit">Add Commission</button>
                            <button
                                type="button"
                                id="comissioncancel"
                                onClick={() => navigate(-1)} // Navigate back on click
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default HRNewCommission;
