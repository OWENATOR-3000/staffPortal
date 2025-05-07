import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchUserDataOnLoad } from "../authslice"; // Use this instead

function ProtectedRoute({ children }) {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const loading = useSelector((state) => state.auth.loading);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchUserDataOnLoad()); // Fetch user data if token exists
    }, [dispatch]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/loginPage" />;
    }

    return children;
}

export default ProtectedRoute;
