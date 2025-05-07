import '../styles/ClockinPage.css';
import SidebarNav from './sidebarNav.jsx';
import Header from './header.jsx';
import { useSelector } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import '../styles/ClockOutReminder.css';

function ClockinPage() {
    const position = useSelector((state) => state.auth.position);
    const userDetails = useSelector((state) => state.auth.data[0]);
    const userRoles = useSelector((state) => state.auth.userRoles); // Access user roles from Redux state
    const userPermissions = useSelector((state) => state.auth.userPermissions);

    const [clockin, setClockin] = useState([]); // State for clockin details
    const [inputDate, setInputDate] = useState(''); // State for date input
    const [currentClockin, setCurrentClockin] = useState(null); // State for current day's clockin details
    const [showReminderPopup, setShowReminderPopup] = useState(false); // State for reminder popup
    const [totalHoursWorked, setTotalHoursWorked] = useState(0); // State for total hours worked today
    const [multipleClockins, setMultipleClockins] = useState([]); // State for multiple clock-ins on the same day
    const reminderTimeout = useRef(null);

    useEffect(() => {
        const fetchClockinDetails = async () => {
            try {
                const res = await fetch(`http://localhost:8080/employeeclockin/${userDetails.id}`);
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                console.log("Fetched clockin data:", data); // Log fetched data
                setClockin(data);

                // Get today's date in local timezone
                const todayLocal = new Date();
                console.log("Today's local date:", todayLocal); // Log today's local date
                const todayDateStr = todayLocal.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

                // Find all of today's clock-in details for multiple entries
                const todayEntries = data.filter(day => {
                    const dbDate = new Date(day.date).toISOString().split('T')[0]; // Get the date in ISO format
                    return dbDate === todayDateStr; // Compare the date part
                });

                console.log("Today's clock-in entries:", todayEntries); // Log today's clock-in details

                // Calculate total hours worked today across all entries on the client side
                let totalHours = 0;
                todayEntries.forEach(entry => {
                    if (entry.clockinTime && entry.clockoutTime) {
                        const clockInParts = entry.clockinTime.split(':');
                        const clockOutParts = entry.clockoutTime.split(':');
                        
                        const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
                        const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);
                        
                        const hours = (clockOutMinutes - clockInMinutes) / 60;
                        if (hours > 0) {
                            totalHours += hours;
                        }
                    }
                });
                setTotalHoursWorked(totalHours.toFixed(2));

                // Set the most recent clock-in as the current one
                if (todayEntries.length > 0) {
                    // Sort by ID descending to get the most recent entry
                    const sortedEntries = [...todayEntries].sort((a, b) => b.id - a.id);
                    setCurrentClockin(sortedEntries[0]);
                    
                    // If there are multiple entries, store them separately
                    if (sortedEntries.length > 1) {
                        setMultipleClockins(sortedEntries.slice(1));
                    } else {
                        setMultipleClockins([]);
                    }
                } else {
                    console.log("No clock-in details found for today."); // Log when there's no entry for today
                    setCurrentClockin(null);
                    setMultipleClockins([]);
                }

                // Set up clock-out reminder if within working hours (Monday-Friday, 8am-5pm)
                scheduleClockOutReminder();
            } catch (err) {
                console.error('Fetch clockin data error:', err);
            }
        };

        fetchClockinDetails();

        // Cleanup timeout on unmount
        return () => {
            if (reminderTimeout.current) {
                clearTimeout(reminderTimeout.current);
            }
        };
    }, [userDetails.id]); // Dependency array includes employee id
    
    // Schedule clock-out reminder for 4:55 PM
    const scheduleClockOutReminder = () => {
        const now = new Date();
        const currentDay = now.getDay();
        
        // Only schedule reminder on weekdays (Monday-Friday)
        if (currentDay >= 1 && currentDay <= 5) {
            const reminderTime = new Date();
            reminderTime.setHours(16, 55, 0, 0); // 4:55 PM
            
            // If it's already past 4:55 PM, don't schedule reminder
            if (now > reminderTime) return;
            
            const timeUntilReminder = reminderTime - now;
            console.log(`Scheduling clock-out reminder in ${timeUntilReminder/1000} seconds`);
            
            // Clear any existing reminder
            if (reminderTimeout.current) {
                clearTimeout(reminderTimeout.current);
            }
            
            // Set the new reminder
            reminderTimeout.current = setTimeout(() => {
                setShowReminderPopup(true);
                
                // Auto-hide after 10 minutes if not dismissed
                setTimeout(() => {
                    setShowReminderPopup(false);
                }, 10 * 60 * 1000);
            }, timeUntilReminder);
        }
    };

    const handleDateChange = (event) => {
        setInputDate(event.target.value); // Update input date state
    };

    const handleClear = () => {
        setInputDate(''); // Clear the date input
    };

    const formatDateToLocal = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so add 1
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const filteredClockin = inputDate ? clockin.filter(day => {
        const formattedDbDate = formatDateToLocal(day.date); // Convert DB date to 'YYYY-MM-DD' in local time
        return formattedDbDate === inputDate; // Compare directly with the input date
    }) : clockin; // Show all records if no date is entered

    const handleClockOut = async () => {
        if (!currentClockin) {
            console.warn("No current clock-in details available for clocking out."); // Warning if there's no clock-in
            return;
        }
        
        // Check if already clocked out
        if (currentClockin.clockoutTime) {
            console.warn("Already clocked out for this entry.");
            alert("You've already clocked out for this entry.");
            return;
        }
    
        // Use the date from the current clock-in record to ensure we're updating the correct record
        const clockinDate = new Date(currentClockin.date);
        const formattedDate = clockinDate.toISOString().slice(0, 19).replace('T', ' '); // Format as 'YYYY-MM-DD HH:MM:SS'
    
        const clockoutData = {
            date: formattedDate,
            employee_id: userDetails.id,
        };
    
        console.log('Clock-out request for record:', currentClockin.id);
        console.log('Clock-out data:', clockoutData);
    
        try {
            const response = await fetch('http://localhost:8080/clockout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clockoutData),
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const result = await response.json();
            console.log('Clock-out successful:', result); // Log the successful response
            
            // Notify the user of successful clock-out
            alert('Clock-out successful!');
    
            // Refresh the clock-in data to show the updated information
            const res = await fetch(`http://localhost:8080/employeeclockin/${userDetails.id}`);
            if (res.ok) {
                const data = await res.json();
                const todayStr = new Date().toISOString().split('T')[0];
                
                // Find all of today's entries
                const todayEntries = data.filter(day => {
                    const dbDate = new Date(day.date).toISOString().split('T')[0];
                    return dbDate === todayStr;
                }).sort((a, b) => b.id - a.id); // Sort by id descending
                
                if (todayEntries.length > 0) {
                    setCurrentClockin(todayEntries[0]);
                    setMultipleClockins(todayEntries.length > 1 ? todayEntries.slice(1) : []);
                    
                    // Calculate total hours worked on the client side
                    let totalHours = 0;
                    todayEntries.forEach(entry => {
                        if (entry.clockinTime && entry.clockoutTime) {
                            const clockInParts = entry.clockinTime.split(':');
                            const clockOutParts = entry.clockoutTime.split(':');
                            
                            const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
                            const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);
                            
                            const hours = (clockOutMinutes - clockInMinutes) / 60;
                            if (hours > 0) {
                                totalHours += hours;
                            }
                        }
                    });
                    setTotalHoursWorked(totalHours.toFixed(2));
                }
                
                setClockin(data);
            }
        } catch (error) {
            console.error('Clock-out error:', error);
            alert('Clock-out failed. Please try again.');
        }
    };
    
    const handleClockIn = async () => {
        // This handles the case of clocking in again after clocking out earlier in the day
        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' '); // Format as 'YYYY-MM-DD HH:MM:SS'
        
        const clockinData = {
            date: formattedDate,
            employee_id: userDetails.id,
        };
        
        console.log('Additional clock-in request:', clockinData);
        
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
            console.log('Additional clock-in successful:', result);
            
            alert('Clock-in successful!');
            
            // Refresh the clock-in data
            const res = await fetch(`http://localhost:8080/employeeclockin/${userDetails.id}`);
            if (res.ok) {
                const data = await res.json();
                const todayStr = new Date().toISOString().split('T')[0];
                
                // Find all of today's entries
                const todayEntries = data.filter(day => {
                    const dbDate = new Date(day.date).toISOString().split('T')[0];
                    return dbDate === todayStr;
                }).sort((a, b) => b.id - a.id); // Sort by id descending
                
                if (todayEntries.length > 0) {
                    setCurrentClockin(todayEntries[0]);
                    setMultipleClockins(todayEntries.length > 1 ? todayEntries.slice(1) : []);
                }
                
                setClockin(data);
            }
        } catch (error) {
            console.error('Additional clock-in error:', error);
            alert('Clock-in failed. Please try again.');
        }
    };
    
    console.log('User Permissions:', userPermissions);
    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className='main-content'>
            {/* Clock Out Reminder Popup */}
            {showReminderPopup && (
                <div className="reminder-popup">
                    <div className="reminder-content">
                        <h3>Clock-Out Reminder</h3>
                        <p>It's almost 5:00 PM! Please remember to clock out before you leave.</p>
                        <button onClick={() => setShowReminderPopup(false)}>Dismiss</button>
                        <button onClick={() => {
                            handleClockOut();
                            setShowReminderPopup(false);
                        }}>Clock Out Now</button>
                    </div>
                </div>
            )}
            <div id="clocksection">
            {userPermissions.includes(2) && (
                <div id="currentclockinsection">
                    <div id="innercurrentclockin">
                        <h4>Today's Log</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Clock-In Time</th>
                                    <th>Clock-Out Time</th>
                                    <th>Hours Worked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentClockin ? (
                                    <tr>
                                        <td>{currentClockin.clockinTime || '----'}</td>
                                        <td>{currentClockin.clockoutTime || '----'}</td>
                                        <td>
                                            {(() => {
                                                // Calculate hours worked on the client side
                                                if (currentClockin.clockinTime && currentClockin.clockoutTime) {
                                                    const clockInParts = currentClockin.clockinTime.split(':');
                                                    const clockOutParts = currentClockin.clockoutTime.split(':');
                                                    
                                                    const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
                                                    const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);
                                                    
                                                    return ((clockOutMinutes - clockInMinutes) / 60).toFixed(2);
                                                }
                                                return '----';
                                            })()}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan="3">No clock-in details for today.</td>
                                    </tr>
                                )}
                                {multipleClockins.length > 0 && multipleClockins.map(entry => (
                                    <tr key={entry.id}>
                                        <td>{entry.clockinTime || '----'}</td>
                                        <td>{entry.clockoutTime || '----'}</td>
                                        <td>
                                            {(() => {
                                                // Calculate hours worked on the client side
                                                if (entry.clockinTime && entry.clockoutTime) {
                                                    const clockInParts = entry.clockinTime.split(':');
                                                    const clockOutParts = entry.clockoutTime.split(':');
                                                    
                                                    const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
                                                    const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);
                                                    
                                                    return ((clockOutMinutes - clockInMinutes) / 60).toFixed(2);
                                                }
                                                return '----';
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="clockin-actions">
                            {currentClockin && currentClockin.clockoutTime === null ? (
                                <button onClick={handleClockOut}>Clock-Out</button>
                            ) : (
                                <div>
                                    {/* Show Clock-In button for additional entries during working hours */}
                                    {(() => {
                                        const now = new Date();
                                        const currentHour = now.getHours();
                                        const currentDay = now.getDay(); // 0 is Sunday, 1-5 is Monday-Friday
                                        
                                        // Only show during work hours on weekdays
                                        if (currentDay >= 1 && currentDay <= 5 && currentHour >= 8 && currentHour < 17) {
                                            return <button onClick={handleClockIn}>Clock-In Again</button>;
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                            {totalHoursWorked > 0 && (
                                <p className="total-hours">Total Hours Worked Today: <strong>{totalHoursWorked}</strong></p>
                            )}
                        </div>
                    </div>
                </div>
            )}
                {userPermissions.includes(3) && (
                <div id="lastclockinsection">
                    <h4>Monthly Clocking History</h4>
                    <div>
                        <input
                            type="date"
                            value={inputDate}
                            onChange={handleDateChange} // Update date input state
                        />
                        <button id="clockinclear" onClick={handleClear}>Clear</button>
                    </div>
                    <div id="clockhistorydiv">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Clock-In Time</th>
                                    <th>Clock-Out Time</th>
                                    <th>Hours Worked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClockin.length > 0 ? (
                                    filteredClockin.map((day) => (
                                        <tr key={day.id}>
                                            <td>{new Date(day.date).toLocaleDateString()}</td>
                                            <td>{day.clockinTime || '----'}</td>
                                            <td>{day.clockoutTime || '----'}</td>
                                            <td>
                                                {(() => {
                                                    // Calculate hours worked on the client side
                                                    if (day.clockinTime && day.clockoutTime) {
                                                        const clockInParts = day.clockinTime.split(':');
                                                        const clockOutParts = day.clockoutTime.split(':');
                                                        
                                                        const clockInMinutes = parseInt(clockInParts[0]) * 60 + parseInt(clockInParts[1]);
                                                        const clockOutMinutes = parseInt(clockOutParts[0]) * 60 + parseInt(clockOutParts[1]);
                                                        
                                                        return ((clockOutMinutes - clockInMinutes) / 60).toFixed(2);
                                                    }
                                                    return '----';
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">No Clocking details found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    )}
            </div>
            </div>
                
        </>
    );
}

export default ClockinPage;
