import React from 'react';

const FiscalYearTable = ({ fiscalYearTotals }) => (
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
);

export default FiscalYearTable;
