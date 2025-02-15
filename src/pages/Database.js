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
    const [amount, setAmount] = useState(0);
    const [isRecurring, setIsRecurring] = useState('0');
    // const [monthSince, setMonthSince] = useState('');
    // const [yearSince, setYearSince] = useState('');
    const [dateSince, setDateSince] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalBudget, setTotalBudget] = useState(0);
    const [fiscalYearTotals, setFiscalYearTotals] = useState([]);
    
    const [displayedBudget, setDisplayedBudget] = useState(() => {
        const savedBudget = localStorage.getItem('displayedBudget');
        return savedBudget ? parseFloat(savedBudget) : 0;
    });
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedQuarters, setSelectedQuarters] = useState([]);
    
    
    const handleQuarterChange = (quarter) => {
        setSelectedQuarters(prev => {
            if (prev.includes(quarter)) {
                return prev.filter(q => q !== quarter);
            } else {
                return [...prev, quarter];
            }
        });
    };




    // Add this new function to handle budget updates
    const handleUpdateBudget = (e) => {
        e.preventDefault(); // Prevent form submission
        const newBudget = parseFloat(totalBudget) || 0;
        setDisplayedBudget(newBudget);
        // Save to localStorage whenever budget is updated
        localStorage.setItem('displayedBudget', newBudget.toString());
    };

     // Also initialize totalBudget input with the stored value
     useEffect(() => {
        const savedBudget = localStorage.getItem('displayedBudget');
        if (savedBudget) {
            setTotalBudget(savedBudget);
        }
    }, []);


    // Update fiscal year totals when the fiscal year changes
    useEffect(() => {
        const groupByFiscalYear = (transactions) => {
            const fiscalYearTotals = {};
            
            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const isNextFiscalYear = (date.getMonth() > 5) || 
                                        (date.getMonth() === 5 && date.getDate() === 30);
                const fiscalYear = isNextFiscalYear ? 
                  `${date.getFullYear()}-${date.getFullYear()+1}` : 
                  `${date.getFullYear()-1}-${date.getFullYear()}`;
                
                if (!fiscalYearTotals[fiscalYear]) {
                    fiscalYearTotals[fiscalYear] = 0;
                }
                fiscalYearTotals[fiscalYear] += parseFloat(transaction.amount || 0);
            });
            
            return Object.entries(fiscalYearTotals)
                .map(([fiscalYear, total]) => ({
                    fiscalYear,
                    total
                }))
                .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
        };
    
        setFiscalYearTotals(groupByFiscalYear(rows));
        const now = new Date();
        const currentFiscalYear = `${now.getFullYear() - (now.getMonth() < 6 ? 1 : 0)}-${now.getFullYear() + (now.getMonth() < 6 ? 0 : 1)}`;
        const currentTotal = groupByFiscalYear(rows).find(t => t.fiscalYear === currentFiscalYear)?.total || 0;
        setTotalExpenses(currentTotal.toFixed(2));
    }, [rows]);
    

    

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

        if (option === 'By Name' && name) params.name = name;
        if (option === 'By Department' && department) params.department = department;
        if (option === 'Recurring') params.is_recurring_expense = isRecurring === '1' ? 'true' : 'false';
        if (option === 'Specific Price Match' && amount) params.amount = amount;
        // if (monthSince) params.month_since = monthSince;
        // if (yearSince) params.year_since = yearSince;
        // if (dateSince) params.date_since = dateSince;
        // if (dateTo) params.date_to = dateTo;

        // Convert dates to full ISO string with time set to end of day for To date
        if (dateSince) {
            const fromDate = new Date(dateSince);
            if (!isNaN(fromDate.getTime())) {
                fromDate.setHours(1, 0, 0, 0);  // Start of day
                params.date_since = fromDate.toISOString();
            }
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            if (!isNaN(toDate.getTime())) {
                toDate.setHours(23, 59, 59, 999);  // End of day
                params.date_to = toDate.toISOString();
            }
        }


        // Quarter and year filters
    if (selectedYear && selectedQuarters.length > 0) {
        params.year = selectedYear;
        params.quarters = JSON.stringify(selectedQuarters); // Send quarters as a JSON string
    }

        try {
            let response = await axios.get(`${API_URL}/api/rows`, { params });
            // Additional client-side filtering to ensure end date is strictly enforced
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                response.data = response.data.filter(row => {
                    const rowDate = new Date(row.date);
                    return rowDate <= endDate;
                });
            }
            setRows(response.data);
            calculateTotal(response.data);
        } catch (error) {
            console.error('Error fetching filtered data:', error);
        }
    };

    // Calculate total expenses
    const calculateTotal = (data) => {
        const currentYear = new Date().getFullYear();
        const fiscalStart = new Date(currentYear - 1, 5, 1); // July 1st of the previous year
        const fiscalEnd = new Date(currentYear, 4, 30, 23, 59, 59); // June 30th of the current year
    
        const filteredData = data.filter((row) => {
            const rowDate = new Date(row.date); // Parse the row's date
            return rowDate >= fiscalStart && rowDate <= fiscalEnd;
        });
    
        const total = filteredData.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
        setTotalExpenses(total.toFixed(2)); // Format to 2 decimal places
    };
    

    // Handle checkbox change for recurring expense
    const handleCheckboxChange = (event) => {
        setIsRecurring(event.target.checked ? '1' : '0');
    };

    // Department options
    const departments = [
        "Adult Services", "AV", "Chester", "Circulation", "Communications",
        "HBB", "IT Needs", "IT Staff", "IT Public", "Passport", "South End", "Weed", "Youth"
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
    const searchOptions = ["By Name", "By Department", "Recurring", "Specific Price Match"];




    return (
        <div className="database-page">
            <h4>Search expenses database:</h4>
            <form className="form-container" onSubmit={handleSubmit}>
                <Dropdown label="Select search criteria:" options={searchOptions} value={option} onChange={setOption} placeholder="Select" />
                {option === 'By Name' && (
                    <label>
                        Employee Name:
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                )}
                {option === 'By Department' && (
                    <Dropdown label="Select a Department" options={departments} value={department} onChange={setDepartment} placeholder="Choose a department" />
                )}
                {option === 'Recurring' && (
                    <label>
                        Recurring Expense:
                        <input type="checkbox" checked={isRecurring === '1'} onChange={handleCheckboxChange} />
                    </label>
                )}
                {option === 'Specific Price Match' && (
                    <label>
                        Specific Price Match:
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </label>
                )}



<div className="flex-container">
    <div className="date-range-section">
        Search by Date:
        <label>
            From:
            <input 
                type="date" 
                value={dateSince} 
                onChange={(e) => setDateSince(e.target.value)} 
            />
        </label>
        <label>
            To:
            <input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
            />
        </label>
    </div>

    {/* Add a separator line */}
    <div className="separator"></div>

    <div className="quarter-filter">
            <label>
                Select Year:
                <input 
                    type="text" 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)} 
                    placeholder="Enter Year" 
                    className="year-select"
                />
            </label>
        
        <div className="quarters-container">
            <label className="quarter-checkbox">
                <input 
                    type="checkbox"
                    checked={selectedQuarters.includes('Q1')}
                    onChange={() => handleQuarterChange('Q1')}
                />
                Q1 (Jan-Mar)
            </label>
            
            <label className="quarter-checkbox">
                <input 
                    type="checkbox"
                    checked={selectedQuarters.includes('Q2')}
                    onChange={() => handleQuarterChange('Q2')}
                />
                Q2 (Apr-Jun)
            </label>
            
            <label className="quarter-checkbox">
                <input 
                    type="checkbox"
                    checked={selectedQuarters.includes('Q3')}
                    onChange={() => handleQuarterChange('Q3')}
                />
                Q3 (Jul-Sep)
            </label>
            
            <label className="quarter-checkbox">
                <input 
                    type="checkbox"
                    checked={selectedQuarters.includes('Q4')}
                    onChange={() => handleQuarterChange('Q4')}
                />
                Q4 (Oct-Dec)
            </label>
        </div>
    </div>
</div>



                <button type="submit">Search</button>

                <div className="flex items-center gap-4">
                <label className="total-budget">
                    Total Budget for the Year:
                    <input 
                        type="number" 
                        min="0" 
                        value={totalBudget} 
                        onChange={(e) => setTotalBudget(e.target.value)} 
                        placeholder="Total Budget" 
                    />
                    <button
                        type="button"
                        onClick={handleUpdateBudget}
                        className="update-budget-btn"
                    >
                        Update Budget
                    </button>
                </label>
                </div>
                <div className="budget-info">
                    <div className="total-expenses">
                        Budget Left: ${((displayedBudget - totalExpenses) || 0).toFixed(2)}
                    </div>
                    <div className="total-expenses2">
                        Total Spending: ${totalExpenses}
                    </div>
                    <div className="total-budget-display">
                        Budget: ${displayedBudget.toFixed(2)}
                    </div>
                </div>
            </form>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Department</th>
						<th>Name</th>
                        <th>Description</th>
						<th>Recurring?</th>
                    </tr>
                    </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>{new Date(row.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                            <td>{row.amount}</td>
                            <td>{row.department}</td>
							<td>{row.name}</td>
                            <td>{row.description}</td>
							<td>{row.is_recurring_expense ? 'Yes' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <table className="fiscal-year-table">
                <thead>
                    <tr>
                        <th>Fiscal Year</th>
                        <th>Total Expenses</th>
                    </tr>
                </thead>
                <tbody>
                    {fiscalYearTotals.map((entry, index) => (
                        <tr key={index}>
                            <td>{entry.fiscalYear}</td>
                            <td>${entry.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="total-expenses">
                Budget Left: ${((totalBudget - totalExpenses) || 0).toFixed(2)}
            </div>

            <div className="total-expenses2">Total Spending: ${totalExpenses}</div>
        </div>
    );
};

export default Database;