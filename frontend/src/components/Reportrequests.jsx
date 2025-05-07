import SidebarNav from './sidebarNav.jsx';
import Header from './header.jsx';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import axios from 'axios'; // Import Axios
import '../styles/Reportrequests.css';

function Reportrequests() {
    const position = useSelector((state) => state.auth.position);
    const userDetails = useSelector((state) => state.auth.data[0]);
    const [printingRequests, setPrintingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userPermissions = useSelector((state) => state.auth.userPermissions);

    useEffect(() => {
        const fetchPrintingRequests = async () => {
            try {
                const response = await axios.get("http://localhost:8080/api/getprinting");
                setPrintingRequests(response.data);
            } catch (err) {
                console.error('Error fetching printing requests:', err);
                setError(err.response ? err.response.data.message : err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPrintingRequests();
    }, []);

    const handleStatusChange = async (id) => {
        try {
            const response = await axios.patch(`http://localhost:8080/api/setprinting/${id}`, {
                status: 'Sent', // Change the status to 'Sent'
            });
            // Update the state with the new status
            setPrintingRequests((prevRequests) =>
                prevRequests.map((request) =>
                    request.id === id ? { ...request, status: response.data.status } : request
                )
            );
        } catch (err) {
            console.error('Error updating printing request status:', err);
            setError(err.response ? err.response.data.message : err.message);
        }
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className="reportrequestmain">
                <h3>Report Requests</h3>
                <div id="rrequestsection">
                    {loading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p style={{ color: 'red' }}>Error fetching requests: {error}</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>From</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
    {printingRequests.map((request) => (
        <tr key={request.id}>
            <td>{request.name}</td>
            <td>{request.email}</td>
            <td>{request.type}</td>
            <td>{new Date(request.date).toLocaleDateString()}</td>
            <td>{request.status}</td>
            <td>
                {request.status === 'unsent' && userPermissions.includes(28) && (
                    <button
                        id="statuschangebutton"
                        onClick={() => handleStatusChange(request.id)}
                        disabled={request.status === 'Sent'} // Disable button if already sent
                    >
                        Sent
                    </button>
                )}
            </td>
        </tr>
    ))}
</tbody>

                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

export default Reportrequests;
