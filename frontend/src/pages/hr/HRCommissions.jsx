import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './style/index.css';
import plus from './assets/plus.png';
import { useNavigate } from 'react-router-dom';

function HRCommissions() {
    const navigate = useNavigate();
    const position = useSelector((state) => state.auth.position);
    const [commissions, setCommissions] = useState([]); // Store all commissions
    const [selectedCommission, setSelectedCommission] = useState(null); // Track selected commission
    const userPermissions = useSelector((state) => state.auth.userPermissions);

    // Fetch all commissions
    useEffect(() => {
        fetch('http://localhost:8080/getcommissions')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                console.log('Fetched commissions:', data); // Log the data for verification

                // Ensure that the data is an array
                const commissionsArray = Array.isArray(data) ? data : [data];
                
                // Format the commissions into objects
                const formattedCommissions = commissionsArray.map(item => ({
                    employee_id: item.employee_id,
                    employee_name: item.employee_name,
                    employee_surname: item.employee_surname,
                    item_name: item.item_name,
                    sale_type: item.sale_type,
                    commission: item.commission,
                    vat: item.vat,
                    product_cost: item.product_cost,
                    date: item.date,
                }));

                setCommissions(formattedCommissions);
            })
            .catch(err => console.error('Fetch error:', err));
    }, []);

    // Fetch commission details when a commission is clicked
    const handleCommissionClick = (commission) => {
        setSelectedCommission(commission);
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <div className='main-content'>
            <div id="commissioncontent">
                <div className="commissionmain">
                    <div id="commissionhistory">
                        <h4>Commission History</h4>
                        <table>
                            <tbody>
                                {commissions.length > 0 ? (
                                    commissions.map((commission, index) => (
                                        <tr key={index} onClick={() => handleCommissionClick(commission)}>
                                            <td>{commission.employee_name} {commission.employee_surname} - {new Date(commission.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2">No commissions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div id="comissionlist">
                        <h5>{selectedCommission ? `${selectedCommission.employee_name}'s commission` : 'Select a commission to see details'}</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Sale Type</th>
                                    <th>Date</th>
                                    <th>VAT</th>
                                    <th>Product Cost</th>
                                    <th>Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedCommission ? (
                                    <tr>
                                        <td>{selectedCommission.item_name}</td>
                                        <td>{selectedCommission.sale_type}</td>
                                        <td>{new Date(selectedCommission.date).toLocaleDateString()}</td>
                                        <td>{selectedCommission.vat}%</td>
                                        <td>N${selectedCommission.product_cost}</td>
                                        <td>N${selectedCommission.commission}</td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan="6">Select a commission to see details.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {userPermissions.includes(25) && (
                <div id="newcommission" onClick={() => navigate('/hrnewcommission')}>
                    <img src={plus} alt="Plus Icon" />
                    <p>New Commission</p>
                </div>
                )}
            </div>
            </div>
        </>
    );
}

export default HRCommissions;
