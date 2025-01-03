import React from 'react';

const Dropdown = ({ label, options, value, onChange, placeholder }) => {
    return (
        <div>
            {label && <label htmlFor="dropdown">{label}</label>}
            <select id="dropdown" value={value} onChange={(e) => onChange(e.target.value)}>
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map((option, index) => (
                    <option key={index} value={option.value || option}>
                        {option.label || option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Dropdown;