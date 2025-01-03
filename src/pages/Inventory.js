import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';

const Inventory = () => {
	const [option, setOption] = useState('');
	const searchOptions = ["Keyboards", "Mice", "Hotspots", "Monitors"];
    return (
        <div>
            <h4>Inventory Page</h4>
            <table>
                <thead>
                    <tr>
                        <th>Item Category</th>
                        <th>Quantity</th>
                        <th>Date Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;

