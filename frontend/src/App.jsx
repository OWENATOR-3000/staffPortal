import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Provider } from 'react-redux'
import { store } from "./store"
import LoginPage from "./pages/employee/loginPage"
import HomePage from "./pages/employee/homePage"
import LeaveRequest from "./pages/employee/leaverequestPage"
import OvertimeviewPage from "./pages/employee/overtimeviewPage"
import './styles/standard.css'
import OvertimerequestPage from "./pages/employee/overtimerequestPage"
import PasswordrequestPage from "./pages/employee/passwordrequestPage"
import PrintingrequestPage from "./pages/employee/printingrequestPage"
import ClockinclockoutPage from "./pages/employee/clockinclockoutPage"
import StaffRegistrationForm from "./components/StaffRegister"
import HRLeaverequests from "./pages/hr/HRLeaverequests"
import HROvertimerequests from "./pages/hr/HROvertimerequests"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminHomePage from "./pages/admin/adminHomePage"
import StaffRegistrationAdmin from "./pages/admin/staffRegistrationAdmin"
import HRhome from "./pages/hr/HRhome"
import HRPayroll from "./pages/hr/HRPayroll"
import HRrequestleave from "./pages/hr/HRrequestleave"
import HRrequestovertime from "./pages/hr/HRrequestovertime"
import HRViewStaffProfiles from "./pages/hr/HRViewStaff"
import EditStaffInfo from "./pages/hr/editStaffInfo"
import MAINPAGE from "./components/MainPage"
import StaffProfiles from "./pages/admin/staffProfiles"
import ChangeStaffInfo from "./pages/admin/changeStaffInfo"
import HRChosenemployee from "./pages/hr/HRChosenemployee"
// import HRRequests from "./pages/hr/HRRequests"
import AdminRequests from "./pages/admin/adminRequests"
import HRHomePage from "./pages/hr/HRhomePage"
import ModernHRRequests from './pages/hr/ModernHRRequests';
// import '../../frontend/src/styles/HomePage.tailwind.css';
// import ViewPrintingrequest from "./pages/employee/printingrequestPage"
// import HRPayroll from "./pages/hr/HRPayroll"
// import ModernMessagePlatform from './components/ModernMessagePlatform';
import { useSelector } from 'react-redux';

//new stuff
import Viewrequests from "./pages/admin/viewrequests"
import Misseddays from './pages/hr/HRMisseddays'
import HRDocupload from "./pages/hr/HRDocupload"
import HRCommissions from "./pages/hr/HRCommissions"
import HRNewcommission from "./pages/hr/HRNewcommission"
import AdminRights from "./pages/admin/adminRights"
import ClockinPage from "./components/ClockinPage"
import Superregister from "./pages/superadmin/superregister"
import Reportrequests from "./components/Reportrequests"
import Setpayroll from "./components/Setpayroll"
import OvertimeViewPage from "./pages/employee/overtimeviewPage"
import LeaveViewPage from "./pages/employee/leaveviewPage"
import PrintingViewPage from "./pages/employee/printingviewpage"


// import 'bootstrap/dist/css/bootstrap.min.css';
// import Admindashboard from "./pages/AdminDashBoard"

function Logout() {
  localStorage.clear()
  return <Navigate to="/MainPage" />
}



function App() {
  return (
    <>

      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            {/* Login */}
            <Route path="/" element={<MAINPAGE />} />
            <Route path="/loginPage" element={<LoginPage />} />

            {/* Protected Routes - Home Page */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* Employee Portal*/}
            <Route path="/home" element={<HomePage />} />
            {/* Protected Routes - Employee */}
            <Route
              path="/homePage"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaverequest"
              element={
                <ProtectedRoute>
                  <LeaveRequest />
                </ProtectedRoute>
              }
            />



            <Route
              path="/leaveview"
              element={
                <ProtectedRoute>
                  <LeaveViewPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/overtimerequest"
              element={
                <ProtectedRoute>
                  <OvertimerequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/overtimeview"
              element={
                <ProtectedRoute>
                  <OvertimeviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/passwordrequest"
              element={
                <ProtectedRoute>
                  <PasswordrequestPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/printingrequest"
              element={
                <ProtectedRoute>
                  <PrintingrequestPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clockinclockout"
              element={
                <ProtectedRoute>
                  <ClockinclockoutPage />
                </ProtectedRoute>
              }
            />

            {/* Human Resource Portal */}
            {/* Protected Routes - human resource */}

            <Route
              path="/hremployees"
              element={
                <ProtectedRoute>
                  <HRhome />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hrhomepage"
              element={
                <ProtectedRoute>
                  <HRHomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staffregistration"
              element={
                <ProtectedRoute>
                  <StaffRegistrationForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hrrequests"
              element={
                <ProtectedRoute>
                  <ModernHRRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/HRViewStaff"
              element={
                <ProtectedRoute>
                  <HRViewStaffProfiles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/editStaffInfo"
              element={
                <ProtectedRoute>
                  <EditStaffInfo />
                </ProtectedRoute>
              }
            />


            <Route
              path="/hrleaverequests"
              //path="/hrpayroll" 
              element={
                <ProtectedRoute>
                  <HRPayroll />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hrpayroll"
              element={
                <ProtectedRoute>
                  <HRPayroll />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hrrequestleave"
              element={
                <ProtectedRoute>
                  <HRrequestleave />
                </ProtectedRoute>
              }
            />


            <Route
              path="/HROvertimerequests"
              element={
                <ProtectedRoute>
                  <HRrequestovertime />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hrrequestovertime"
              element={
                <ProtectedRoute>
                  <HRrequestovertime />
                </ProtectedRoute>
              }
            />


            <Route
              path="/hrchosenemployee"
              element={
                <ProtectedRoute>
                  <HRChosenemployee />
                </ProtectedRoute>
              }
            />


            <Route
              path="/hrmisseddays"
              element={
                <ProtectedRoute>
                  <Misseddays />
                </ProtectedRoute>
              }
            />


            <Route
              path="/hrdocupload"
              element={
                <ProtectedRoute>
                  <HRDocupload />
                </ProtectedRoute>

              }
            />

            <Route
              path="/ClockinPage"
              element={
                <ProtectedRoute>
                  <ClockinPage />
                </ProtectedRoute>

              }
            />
            <Route path="/hrrequests" element={<ModernHRRequests />} />

            {/* Admin Portal*/}
            {/* Protected Routes - Employee */}
            <Route
              path="/adminhomepage"
              element={
                <ProtectedRoute>
                  <AdminHomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staffRegistrationAdmin"
              element={
                <ProtectedRoute>
                  <StaffRegistrationAdmin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staffProfiles"
              element={
                <ProtectedRoute>
                  <StaffProfiles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/changeStaffInfo"
              element={
                <ProtectedRoute>
                  <ChangeStaffInfo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/adminRequests"
              element={
                <ProtectedRoute>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/viewrequests"
              element={
                <ProtectedRoute>
                  <Viewrequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/adminrights"
              element={
                <ProtectedRoute>
                  <AdminRights />
                </ProtectedRoute>
              }
            />

            <Route
              path="/printingView"
              element={
                <ProtectedRoute>
                  <PrintingViewPage />
                </ProtectedRoute>
              }
            />


            <Route
              path="/hrcommissions"
              element={
                <ProtectedRoute>
                  <HRCommissions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hrnewcommission"
              element={
                <ProtectedRoute>
                  <HRNewcommission />
                </ProtectedRoute>
              }
            />


            <Route
              path="/reportrequests"
              element={
                <ProtectedRoute>
                  <Reportrequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/setpayroll"
              element={
                <ProtectedRoute>
                  <Setpayroll />
                </ProtectedRoute>
              }
            />

            {/* <Route 
        path="/overtimerequestview" 
        element={
        <ProtectedRoute>
          <ViewOvertimeRequests />
        </ProtectedRoute>
        }
        /> */}


            {/* <Route 
        path="/printingrequestview" 
        element={
        <ProtectedRoute>
          <ViewPrintingrequest />
        </ProtectedRoute>
        }
        /> */}

            {/* Super Admin Portal*/}

            <Route
              path="/superregister"
              element={
                <ProtectedRoute>
                  <Superregister />
                </ProtectedRoute>
              }
            />


          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  );

}

export default App;