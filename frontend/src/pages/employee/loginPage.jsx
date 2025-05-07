import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, fetchUserPermissions } from '../../dataloginslice';
import styles from '../../styles/login.module.css';
import glogo from '../../assets/glogo.png';
import Loader from '../../components/loader';

function LoginPage() {
    const [firstname, setFirstname] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated, status } = useSelector((state) => state.auth);
    const position = useSelector((state) => state.auth.position);
    const employeeId = useSelector((state) => state.auth.data[0]?.id); // Assuming employee ID is in the auth data
    const error = useSelector((state) => state.auth.error);
    const userPermissions = useSelector((state) => state.auth.userPermissions); // Access permissions

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Submitted:", { firstname, password });
        dispatch(loginUser({
            firstname,
            password,
        }));
    };

    // Fetch permissions ONCE after login
    useEffect(() => {
        if (isAuthenticated && employeeId && userPermissions.length === 0) {
            // Call clockInEmployee after successful login
            clockInEmployee(employeeId);
            // Fetch permissions after login
            dispatch(fetchUserPermissions(employeeId));
        }
    }, [isAuthenticated, employeeId, dispatch, userPermissions.length]);

    // Navigation logic (runs when permissions are loaded)
    // if they're more roles , they can be added here to navigate to the correct page
    useEffect(() => {
        console.log('isAuthenticated:', isAuthenticated);
        console.log('employeeId:', employeeId);
        console.log('userPermissions:', userPermissions);
        if (isAuthenticated && employeeId) {
            console.log('LoginPage position:', position);
            clockInEmployee(employeeId).finally(() => {
                if (position === 'Human Resource') {
                    navigate('/hrhomepage');
                } else if (position === 'Employee') {
                    navigate('/homePage');
                } else if (position === 'Admin') {
                    navigate('/hrhomepage');
                } else if (position === 'Super Admin') {
                    navigate('/hrhomepage');
                } else if (position === 'Software developer') {
                    navigate('/hrhomepage');
                } else {
                    navigate('/homePage'); // Default fallback
                }
            });
        }
    }, [isAuthenticated, position, navigate, employeeId]);

    const clockInEmployee = async (id) => {
        // Use the current date and time for clocking in
        const now = new Date();

        // Format the date as 'YYYY-MM-DD HH:MM:SS'
        const formattedDate = now.toISOString().split('.')[0].replace('T', ' ');

        const clockinData = {
            date: formattedDate, // Current date and time
            employee_id: id,
        };

        console.log("Clock-in data to send:", clockinData); // Log the data being sent

        try {
            const response = await fetch('http://localhost:8080/clockinset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clockinData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log('Clock-in successful:', result);

            // Save clock-in time to localStorage for immediate access on HR homepage
            if (result.clockinTime) {
                localStorage.setItem('todayClockIn', result.clockinTime);
                localStorage.setItem('lastClockInDate', new Date().toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error('Error during clock-in:', error);
        }
    };

    return (
        <>
            {status === 'loading' && <Loader />}
            <div className={styles['logo-container2']}>
                <img src={glogo} alt="Gmobility Logo" className={styles.logo} />
            </div>
            <div className={styles.everything}>
                <div className={styles.loginform}>
                    <form className={`${styles['form-container']} ${styles.animated} ${styles.fadeInDown}`} onSubmit={handleSubmit}>
                        <div className={styles['heading-for-login-form']}>
                            <h1>Login to Staff Portal</h1>
                        </div>
                        <input
                            className={styles['form-input']}
                            type="firstname"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            placeholder="Firstname"
                            required
                        />
                        <input
                            className={styles['form-input']}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                        {error && <p style={{ color: 'red' }} className={styles.error}>{error}</p>}

                        <button className={styles['form-button']} type="submit">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default LoginPage;
