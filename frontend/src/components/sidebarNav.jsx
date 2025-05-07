import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../authslice'
import '../styles/sidebarstyling.css';
import '../styles/mainpage.css';
import { hasPermission, PERMISSIONS } from '../utils/permissionHelper';
import arrow from '../assets/arrow.png';

function SidebarNav({ position }) {
  console.log('Sidebar position:', position);
  const userPermissions = useSelector((state) => state.auth.userPermissions);
  const userDetails = useSelector((state) => state.auth.data[0]); // Get user details from Redux state
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false); // State for sidebar expansion

  const handleLogout = async () => {
    try {
      // Get the user ID from the already retrieved userDetails
      const userId = userDetails?.id;

      if (userId) {
        console.log('Recording clock-out before logout for user:', userId);

        // Get the current date and time
        const now = new Date();
        const formattedDate = now.toISOString().split('.')[0].replace('T', ' ');

        // Call the clock-out endpoint
        const response = await fetch('http://localhost:8080/clockout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: formattedDate,
            employee_id: userId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Clock-out before logout successful:', result);

          // Clear clock-in data from localStorage
          localStorage.removeItem('todayClockIn');
          localStorage.removeItem('lastClockInDate');
        } else {
          console.error('Failed to record clock-out before logout');
        }
      }
    } catch (error) {
      console.error('Error during logout clock-out:', error);
    } finally {
      // Always log out the user, even if clock-out fails
      dispatch(logout()); // Dispatch logout to clear state and token
    }
  };

  if (!position) {
    console.warn('Position is undefined in SidebarNav component');
    return <div>Position is not available</div>; // Fallback message
  }

  const toggleSidebar = () => {
    setIsExpanded(prev => !prev); // Toggle sidebar expansion state
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossOrigin="anonymous"></link>
      <div className={`Employee-sidebar ${isExpanded ? 'expanded' : ''}`} onClick={toggleSidebar}>
        <img className='arrow' src={arrow} alt="Toggle Sidebar" />
        <ul className={`${isExpanded ? '' : 'disabled-links'}`}>
          {/*Employee */}
          {position === 'Employee' && (
            <>
              <NavLink to="/hrhomepage" className={`item ${location.pathname === '/hrhomepage' ? 'active' : ''}`}>
                <li>Home</li>
              </NavLink>

              {(userPermissions.includes(2) || userPermissions.includes(3)) && (
                <NavLink to="/ClockinPage" className={`item ${location.pathname === '/ClockinPage' ? 'active' : ''}`}>
                  <li>View Clocking</li>
                </NavLink>
              )}

              {userPermissions.includes(4) && (
                <NavLink to="/hremployees" className={`item ${location.pathname === '/hremployees' ? 'active' : ''}`}>
                  <li>View Employees</li>
                </NavLink>
              )}
              {userPermissions.includes(11) && (
                <NavLink to="/staffregistration" className={`item ${location.pathname === '/staffregistration' ? 'active' : ''}`}>
                  <li>Staff registration</li>
                </NavLink>
              )}

              {(userPermissions.includes(13) && userPermissions.includes(15)) && (
                <NavLink to="/hrrequests" className={`item ${location.pathname === '/hrrequests' ? 'active' : ''}`}>
                  <li>View Requests</li>
                </NavLink>
              )}
              {userPermissions.includes(17) && (
                <NavLink to="/hrrequestleave" className={`item ${location.pathname === '/hrrequestleave' ? 'active' : ''}`}>
                  <li>Create Leave Request</li>
                </NavLink>
              )}

              {userPermissions.includes(18) && (
                <NavLink to="/hrrequestovertime" className={`item ${location.pathname === '/hrrequestovertime' ? 'active' : ''}`}>
                  <li>Create Overtime Request</li>
                </NavLink>
              )}

              {userPermissions.includes(19) && (
                <NavLink to="/hrpayroll" className={`item ${location.pathname === '/hrpayroll' ? 'active' : ''}`}>
                  <li>View Payroll</li>
                </NavLink>
              )}

              {userPermissions.includes(22) && (
                <NavLink to="/hrdocupload" className={`item ${location.pathname === '/hrdocupload' ? 'active' : ''}`}>
                  <li>Upload document</li>
                </NavLink>
              )}

              {userPermissions.includes(24) && (
                <NavLink to="/hrcommissions" className={`item ${location.pathname === '/hrcommissions' ? 'active' : ''}`}>
                  <li>Commissions</li>
                </NavLink>
              )}

              {userPermissions.includes(26) && (
                <NavLink to="/reportrequests" className={`item ${location.pathname === '/reportrequests' ? 'active' : ''}`}>
                  <li>Report Requests </li>
                </NavLink>
              )}

              {userPermissions.includes(27) && (
                <NavLink to='/printingrequest' className={`item ${location.pathname === '/printingrequest' ? 'active' : ''}`}>
                  <li>Report request</li>
                </NavLink>
              )}
              {userPermissions.includes(35) && (
                <NavLink to="/overtimeview" className={`item ${location.pathname === '/overtimeview' ? 'active' : ''}`}>
                  <li>View Overtime</li>
                </NavLink>
              )}
              {userPermissions.includes(36) && (
                <NavLink to="/leaveview" className={`item ${location.pathname === '/leaveview' ? 'active' : ''}`}>
                  <li>View Leave</li>
                </NavLink>
              )}


              {userPermissions.includes(37) && (
                <NavLink to="/printingview" className={`item ${location.pathname === '/printingview' ? 'active' : ''}`}>
                  <li>View Report </li>
                </NavLink>
              )}

            </>
          )}
          {/*Human Resource */}
          {position === 'Human Resource' && (
            <>
              <NavLink to="/hrhomepage" className={`item ${location.pathname === '/hrhomepage' ? 'active' : ''}`}>
                <li>Home</li>
              </NavLink>

              {(userPermissions.includes(2) || userPermissions.includes(3)) && (
                <NavLink to="/ClockinPage" className={`item ${location.pathname === '/ClockinPage' ? 'active' : ''}`}>
                  <li>View Clocking</li>
                </NavLink>
              )}

              {userPermissions.includes(4) && (
                <NavLink to="/hremployees" className={`item ${location.pathname === '/hremployees' ? 'active' : ''}`}>
                  <li>View Employees</li>
                </NavLink>
              )}
              {userPermissions.includes(11) && (
                <NavLink to="/staffregistration" className={`item ${location.pathname === '/staffregistration' ? 'active' : ''}`}>
                  <li>Staff registration</li>
                </NavLink>
              )}

              {(userPermissions.includes(13) && userPermissions.includes(15)) && (
                <NavLink to="/hrrequests" className={`item ${location.pathname === '/hrrequests' ? 'active' : ''}`}>
                  <li>View Requests</li>
                </NavLink>
              )}
              {userPermissions.includes(17) && (
                <NavLink to="/hrrequestleave" className={`item ${location.pathname === '/hrrequestleave' ? 'active' : ''}`}>
                  <li>Create Leave Request</li>
                </NavLink>
              )}

              {userPermissions.includes(18) && (
                <NavLink to="/hrrequestovertime" className={`item ${location.pathname === '/hrrequestovertime' ? 'active' : ''}`}>
                  <li>Create Overtime Request</li>
                </NavLink>
              )}

              {userPermissions.includes(19) && (
                <NavLink to="/hrpayroll" className={`item ${location.pathname === '/hrpayroll' ? 'active' : ''}`}>
                  <li>View Payroll</li>
                </NavLink>
              )}

              {userPermissions.includes(22) && (
                <NavLink to="/hrdocupload" className={`item ${location.pathname === '/hrdocupload' ? 'active' : ''}`}>
                  <li>Upload document</li>
                </NavLink>
              )}

              {userPermissions.includes(24) && (
                <NavLink to="/hrcommissions" className={`item ${location.pathname === '/hrcommissions' ? 'active' : ''}`}>
                  <li>Commissions</li>
                </NavLink>
              )}

              {userPermissions.includes(26) && (
                <NavLink to="/reportrequests" className={`item ${location.pathname === '/reportrequests' ? 'active' : ''}`}>
                  <li>Report Requests </li>
                </NavLink>
              )}

              {userPermissions.includes(27) && (
                <NavLink to='/printingrequest' className={`item ${location.pathname === '/printingrequest' ? 'active' : ''}`}>
                  <li>Report request</li>
                </NavLink>
              )}
              {userPermissions.includes(35) && (
                <NavLink to="/overtimeview" className={`item ${location.pathname === '/overtimeview' ? 'active' : ''}`}>
                  <li>View Overtime</li>
                </NavLink>
              )}
              {userPermissions.includes(36) && (
                <NavLink to="/leaveview" className={`item ${location.pathname === '/leaveview' ? 'active' : ''}`}>
                  <li>View Leave</li>
                </NavLink>
              )}


              {userPermissions.includes(37) && (
                <NavLink to="/printingview" className={`item ${location.pathname === '/printingview' ? 'active' : ''}`}>
                  <li>View Report </li>
                </NavLink>
              )}
            </>
          )}
          {/*Admin */}
          {position === 'Admin' && (
            <>

              <NavLink to="/hrhomepage" className={`item ${location.pathname === '/hrhomepage' ? 'active' : ''}`}>
                <li>Home</li>
              </NavLink>

              <NavLink to="/adminrights" className={`item ${location.pathname === '/adminrights' ? 'active' : ''}`}>
                <li>Rights</li>
              </NavLink>

              {(userPermissions.includes(2) || userPermissions.includes(3)) && (
                <NavLink to="/ClockinPage" className={`item ${location.pathname === '/ClockinPage' ? 'active' : ''}`}>
                  <li>View Clocking</li>
                </NavLink>
              )}


              {userPermissions.includes(4) && (
                <NavLink to="/hremployees" className={`item ${location.pathname === '/hremployees' ? 'active' : ''}`}>
                  <li>View Employees</li>
                </NavLink>
              )}
              {userPermissions.includes(11) && (
                <NavLink to="/staffregistration" className={`item ${location.pathname === '/staffregistration' ? 'active' : ''}`}>
                  <li>Staff registration</li>
                </NavLink>
              )}

              {(userPermissions.includes(13) && userPermissions.includes(15)) && (
                <NavLink to="/hrrequests" className={`item ${location.pathname === '/hrrequests' ? 'active' : ''}`}>
                  <li>View Requests</li>
                </NavLink>
              )}
              {userPermissions.includes(17) && (
                <NavLink to="/hrrequestleave" className={`item ${location.pathname === '/hrrequestleave' ? 'active' : ''}`}>
                  <li>Create Leave Request</li>
                </NavLink>
              )}

              {userPermissions.includes(18) && (
                <NavLink to="/hrrequestovertime" className={`item ${location.pathname === '/hrrequestovertime' ? 'active' : ''}`}>
                  <li>Create Overtime Request</li>
                </NavLink>
              )}

              {userPermissions.includes(19) && (
                <NavLink to="/hrpayroll" className={`item ${location.pathname === '/hrpayroll' ? 'active' : ''}`}>
                  <li>View Payroll</li>
                </NavLink>
              )}

              {userPermissions.includes(22) && (
                <NavLink to="/hrdocupload" className={`item ${location.pathname === '/hrdocupload' ? 'active' : ''}`}>
                  <li>Upload document</li>
                </NavLink>
              )}

              {userPermissions.includes(24) && (
                <NavLink to="/hrcommissions" className={`item ${location.pathname === '/hrcommissions' ? 'active' : ''}`}>
                  <li>Commissions</li>
                </NavLink>
              )}

              {userPermissions.includes(26) && (
                <NavLink to="/reportrequests" className={`item ${location.pathname === '/reportrequests' ? 'active' : ''}`}>
                  <li>View Report Requests </li>
                </NavLink>
              )}

              {userPermissions.includes(27) && (
                <NavLink to='/printingrequest' className={`item ${location.pathname === '/printingrequest' ? 'active' : ''}`}>
                  <li>Create Report request</li>
                </NavLink>
              )}
              {userPermissions.includes(35) && (
                <NavLink to="/overtimeview" className={`item ${location.pathname === '/overtimeview' ? 'active' : ''}`}>
                  <li>View Overtime</li>
                </NavLink>
              )}
              {userPermissions.includes(36) && (
                <NavLink to="/leaveview" className={`item ${location.pathname === '/leaveview' ? 'active' : ''}`}>
                  <li>View Leave</li>
                </NavLink>
              )}


              {userPermissions.includes(37) && (
                <NavLink to="/printingview" className={`item ${location.pathname === '/printingview' ? 'active' : ''}`}>
                  <li>View Report </li>
                </NavLink>
              )}
            </>
          )}
          {/*Software Developer */}
          {position === 'Software developer' && (
            <>
              <NavLink to="/hrhomepage" className={`item ${location.pathname === '/hrhomepage' ? 'active' : ''}`}>
                <li>Home</li>
              </NavLink>

              {(userPermissions.includes(2) || userPermissions.includes(3)) && (
                <NavLink to="/ClockinPage" className={`item ${location.pathname === '/ClockinPage' ? 'active' : ''}`}>
                  <li>View Clocking</li>
                </NavLink>
              )}

              {userPermissions.includes(4) && (
                <NavLink to="/hremployees" className={`item ${location.pathname === '/hremployees' ? 'active' : ''}`}>
                  <li>View Employees</li>
                </NavLink>
              )}
              {userPermissions.includes(11) && (
                <NavLink to="/staffregistration" className={`item ${location.pathname === '/staffregistration' ? 'active' : ''}`}>
                  <li>Staff registration</li>
                </NavLink>
              )}
              {(userPermissions.includes(13) && userPermissions.includes(15)) && (
                <NavLink to="/hrrequests" className={`item ${location.pathname === '/hrrequests' ? 'active' : ''}`}>
                  <li>View Requests</li>
                </NavLink>
              )}
              {userPermissions.includes(17) && (
                <NavLink to="/hrrequestleave" className={`item ${location.pathname === '/hrrequestleave' ? 'active' : ''}`}>
                  <li>Create Leave Request</li>
                </NavLink>
              )}
              {userPermissions.includes(18) && (
                <NavLink to="/hrrequestovertime" className={`item ${location.pathname === '/hrrequestovertime' ? 'active' : ''}`}>
                  <li>Create Overtime Request</li>
                </NavLink>
              )}
              {userPermissions.includes(19) && (
                <NavLink to="/hrpayroll" className={`item ${location.pathname === '/hrpayroll' ? 'active' : ''}`}>
                  <li>View Payroll</li>
                </NavLink>
              )}
              {userPermissions.includes(22) && (
                <NavLink to="/hrdocupload" className={`item ${location.pathname === '/hrdocupload' ? 'active' : ''}`}>
                  <li>Upload document</li>
                </NavLink>
              )}
              {userPermissions.includes(24) && (
                <NavLink to="/hrcommissions" className={`item ${location.pathname === '/hrcommissions' ? 'active' : ''}`}>
                  <li>Commissions</li>
                </NavLink>
              )}
              {userPermissions.includes(26) && (
                <NavLink to="/reportrequests" className={`item ${location.pathname === '/reportrequests' ? 'active' : ''}`}>
                  <li>Report Requests </li>
                </NavLink>
              )}
              {userPermissions.includes(27) && (
                <NavLink to='/printingrequest' className={`item ${location.pathname === '/printingrequest' ? 'active' : ''}`}>
                  <li>Report request</li>
                </NavLink>
              )}
              {userPermissions.includes(35) && (
                <NavLink to="/overtimeview" className={`item ${location.pathname === '/overtimeview' ? 'active' : ''}`}>
                  <li>View Overtime</li>
                </NavLink>
              )}
              {userPermissions.includes(36) && (
                <NavLink to="/leaveview" className={`item ${location.pathname === '/leaveview' ? 'active' : ''}`}>
                  <li>View Leave</li>
                </NavLink>
              )}
              {userPermissions.includes(37) && (
                <NavLink to="/printingview" className={`item ${location.pathname === '/printingview' ? 'active' : ''}`}>
                  <li>View Report </li>
                </NavLink>
              )}
            </>
          )}
        </ul>
        <button className={`hrlogout ${isExpanded ? '' : 'disabled-button'}`} onClick={isExpanded ? handleLogout : null}>
          Logout
        </button>
      </div>
      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossOrigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.7/dist/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossOrigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossOrigin="anonymous"></script>
    </>
  )
}

export default SidebarNav;