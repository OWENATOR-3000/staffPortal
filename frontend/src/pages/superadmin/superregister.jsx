import SidebarNav from '../../components/sidebarNav.jsx';
import Header from '../../components/header.jsx';
import { useSelector } from 'react-redux';
import './style/index.css';
import search from './assets/searchicon.png';
import MessagingFloat from '../hr/MessageFloat.jsx';
import personicon from './assets/personicon.png';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Superregister(){
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.data[0]); 
    const [data, setData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredData = data.filter(employee => {
        return (
            employee.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.Surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.Supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.Position.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    if (!user) {
        return <div>Loading...</div>;
    }

    const position = useSelector((state) => state.auth.position);

    useEffect(() => {
        fetch('http://localhost:8080/users')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                setData(data);
            })
            .catch(err => console.error('Fetch error:', err));
    }, []);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    return (
        <>
            <Header />
            <SidebarNav position={position} />
            <MessagingFloat />
            <div className='main-content'>
                <div className="homecontent">
                    <h4 className='greeting'>Welcome Super Admin {user.Name}</h4>

                    <div id="totalemployees">
                        <p><img src={personicon} alt="Person Icon" /> {data.length}</p>
                    </div>
                    
                    <div className='employeesearch'>
                        <img className='searchicon' src={search} alt="Search" />
                        <input 
                            type="text" 
                            placeholder='Search' 
                            value={searchQuery} 
                            onChange={handleSearchChange} 
                        />
                    </div>

                    <div className='innerhomecontent'>
                        {filteredData.length === 0 ? (
                            <p>No employees found</p>
                        ) : (
                            filteredData.map((d, i) => (
                                <div 
                                    key={i} 
                                    className="employeecard" 
                                    onClick={() => navigate('/hrchosenemployee', { state: { employee: d } })} 
                                >
                                    <img  
                                        src={`http://localhost:8080/staff/${d.id}/profile-image`} 
                                        alt='Profile Image' 
                                    />

                                    <div id="employeeinner">
                                        <p id="employeename">{d.Name} {d.Surname}</p>
                                        <p id="employeeposition">{d.Position}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Superregister