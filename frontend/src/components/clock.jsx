import React, { useState, useEffect } from 'react';

function DigitalClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };

    // Update the clock immediately and every second
    updateClock();
    const intervalId = setInterval(updateClock, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.clock}>{time}</div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '50px',
    right: '180px',

    fontFamily: 'Arial, sans-serif',
    zIndex: 1000,  // Ensures the clock is on top of other elements
  },
  clock: {
    fontSize: '4rem',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.8)',
  },
};

export default DigitalClock;
