import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/MainPage.module.css';
import gif from '../assets/gif.gif';
import glogo from '../assets/glogo.png';
import DigitalClock from './clock';

function MAINPAGE() {
    return (
        <>
            <div className={styles['logo-container']}>
                <img src={glogo} alt="Gmobility Logo" className={styles.logo} /> {/* Add logo here */}
            </div>
            <div className={styles['main-container']}>
                <div className={styles['mainpage-content']}>
                    <img src={gif} alt="GIF Description" className={styles['bottom-left-gif']} />
                </div>
            </div>
            <div className={styles['heading-container']}>
                <h1>WELCOME</h1>
            </div>
            <div className={styles['heading2-container']}>
                <h6>TO GMOBILITY'S STAFF PORTAL</h6>
            </div>
            <DigitalClock />
            <Link to="/loginPage" className={styles['login-text']}>Login</Link>
        </>
    )
}

export default MAINPAGE