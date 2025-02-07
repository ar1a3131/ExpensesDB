import React from 'react';

const DateSearch = ({ fromDate, toDate, setFromDate, setToDate }) => (
    <div className="date-search">
        <label>
            From:
            <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
            />
        </label>
        <label>
            To:
            <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
            />
        </label>
    </div>
);

export default DateSearch;
