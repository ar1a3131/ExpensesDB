// src/components/MyButton.js
import React, { useState } from 'react';

const MyButton = ({ onClick, label }) => {
    const [isHovered, setIsHovered] = useState(false);


const styles = {
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: isHovered ? '#3e8e41' : '#4CAF50', // Darker green on hover
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.15s', // Smooth transition
    },
};

    return (
        <button onClick={onClick} 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={styles.button}>
            {label}
        </button>
    );

};

export default MyButton;