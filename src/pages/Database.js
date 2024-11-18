import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dropdown from './Dropdown';
import './Database.css';

const API_URL = process.env.REACT_APP_API_URL;

const Database = () => {
    const [option, setOption] = useState('');
    const [rows, setRows] = useState([]);
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [isRecurring, setIsRecurring] = useState('0');
    const [monthSince, setMonthSince] = useState('');
    const [yearSince, setYearSince] = useState('');
    const [totalExpenses, setTotalExpenses] = useState(0);

    // Fetch all data initially
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/rows`); // Replace IP address if needed
                setRows(response.data);
                calculateTotal(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    // Handle form submission and apply filters
    const handleSubmit = async (event) => {
        event.preventDefault();
        const params = {};

        if (option === 'By name' && name) params.name = name;
        if (option === 'By department' && department) params.department = department;
        if (option === 'Recurring') params.is_recurring_expense = isRecurring === '1' ? 'true' : 'false';
        if (monthSince) params.month_since = monthSince;
        if (yearSince) params.year_since = yearSince;

        try {
            const response = await axios.get(`${API_URL}/api/rows`, { params }); // Replace IP address if needed
            setRows(response.data);
            calculateTotal(response.data);
        } catch (error) {
            console.error('Error fetching filtered data:', error);
        }
    };

    // Calculate total expenses
    const calculateTotal = (data) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
        setTotalExpenses(total.toFixed(2)); // Format to 2 decimal places
    };

    // Handle checkbox change for recurring expense
    const handleCheckboxChange = (event) => {
        setIsRecurring(event.target.checked ? '1' : '0');
    };

    // Department options
    const departments = [
        "Adult Services", "AV", "Chester", "Circulation", "Communications",
        "HBB", "IT Needs", "Passport", "South End", "Weed", "Youth"
    ];

    // Month options
    const months = [
        { value: '1', label: 'January' }, { value: '2', label: 'February' },
        { value: '3', label: 'March' }, { value: '4', label: 'April' },
        { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' },
        { value: '9', label: 'September' }, { value: '10', label: 'October' },
        { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];

    // Search criteria options
    const searchOptions = ["By name", "By department", "Recurring"];

    return (
        <div className="database-page">
            <h4>Search through expenses database:</h4>
            <form className="form-container" onSubmit={handleSubmit}>
                <Dropdown label="Select search criteria:" options={searchOptions} value={option} onChange={setOption} placeholder="Select" />
                {option === 'By name' && (
                    <label>
                        Employee Name:
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                )}
                {option === 'By department' && (
                    <Dropdown label="Select a Department" options={departments} value={department} onChange={setDepartment} placeholder="Choose a department" />
                )}
                {option === 'Recurring' && (
                    <label>
                        Recurring Expense:
                        <input type="checkbox" checked={isRecurring === '1'} onChange={handleCheckboxChange} />
                    </label>
                )}
                <div className="flex-container">
                    <Dropdown label="Select start month:" options={months} value={monthSince} onChange={setMonthSince} placeholder="Month" />
                    <label>
                        Year Since:
                        <input type="number" min="1900" value={yearSince} onChange={(e) => setYearSince(e.target.value)} placeholder="Year" />
                    </label>
                </div>
                <button type="submit">Search</button>
            </form>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Department</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>{row.date}</td>
                            <td>{row.amount}</td>
                            <td>{row.department}</td>
                            <td>{row.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div>Total Expenses: ${totalExpenses}</div>
        </div>
    );
};

export default Database;

