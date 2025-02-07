import React from 'react';
import Dropdown from './Dropdown';

const SearchForm = ({ 
    option, 
    setOption, 
    name, 
    setName, 
    department, 
    setDepartment, 
    isRecurring, 
    setIsRecurring, 
    amount, 
    setAmount, 
    monthSince, 
    setMonthSince, 
    yearSince, 
    setYearSince, 
    handleSubmit,
    departments,
    searchOptions,
    months
}) => (
    <form className="form-container" onSubmit={handleSubmit}>
        <Dropdown 
            label="Select search criteria:" 
            options={searchOptions} 
            value={option} 
            onChange={setOption} 
            placeholder="Select" 
        />
        {option === 'By Name' && (
            <label>
                Employee Name:
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                />
            </label>
        )}
        {option === 'By Department' && (
            <Dropdown 
                label="Select a Department" 
                options={departments} 
                value={department} 
                onChange={setDepartment} 
                placeholder="Choose a department" 
            />
        )}
        {option === 'Recurring' && (
            <label>
                Recurring Expense:
                <input 
                    type="checkbox" 
                    checked={isRecurring === '1'} 
                    onChange={(e) => setIsRecurring(e.target.checked ? '1' : '0')} 
                />
            </label>
        )}
        {option === 'Specific Price Match' && (
            <label>
                Specific Price Match:
                <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                />
            </label>
        )}
        <div className="flex-container">
            <Dropdown 
                label="Select start month:" 
                options={months} 
                value={monthSince} 
                onChange={setMonthSince} 
                placeholder="Month" 
            />
            <label>
                Year Since:
                <input 
                    type="number" 
                    min="1900" 
                    value={yearSince} 
                    onChange={(e) => setYearSince(e.target.value)} 
                    placeholder="Year" 
                />
            </label>
        </div>
        <button type="submit">Search</button>
    </form>
);

export default SearchForm;
