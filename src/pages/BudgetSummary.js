import React from 'react';

const BudgetSummary = ({ totalExpenses, totalBudget, setTotalBudget }) => (
    <div>
        <label className="total-budget">
            Total Budget for the Year:
            <input 
                type="number" 
                min="0" 
                value={totalBudget} 
                onChange={(e) => setTotalBudget(e.target.value)} 
                placeholder="Total Budget" 
            />
        </label>
        <div className="total-expenses">
            Budget Left: ${((totalBudget - totalExpenses) || 0).toFixed(2)}
        </div>
        <div className="total-expenses2">
            Total Spending: ${totalExpenses}
        </div>
    </div>
);

export default BudgetSummary;
