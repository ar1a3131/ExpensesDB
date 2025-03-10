
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5002; // Backend is using port 5002

const API_URL = process.env.REACT_APP_API_URL;
const USER = process.env.DB_USER;
const HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.DB_PORT;

// Enable CORS for frontend communication
app.use(cors({ origin: '*' }));  // Allow all origins for testing purposes
app.use(express.json()); // Enable JSON parsing for incoming requests



// Connect to PostgreSQL
const pool = new Pool({
    user: USER,
    host: HOST, // Update with the correct IP address of your database server
    database: DB_NAME,
    password: DB_PASSWORD,
    port: PORT,  // Your PostgreSQL port
});

// Confirm the database connection is successful
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to PostgreSQL database successfully!');
    }
});



app.get('/api/rows', async (req, res) => {
    const { name, department, is_recurring_expense, date_since, date_to, amount, year, quarters } = req.query;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let paramCounter = 1;

    // Add conditions based on the request query
    if (name) {
        query += ` AND name ILIKE $${paramCounter}`;
        params.push(`%${name}%`);
        paramCounter++;
    }
    if (department) {
        query += ` AND department = $${paramCounter}`;
        params.push(department);
        paramCounter++;
    }
    if (is_recurring_expense !== undefined) {
        query += ` AND is_recurring_expense = $${paramCounter}`;
        params.push(is_recurring_expense === 'true' ? '1' : '0');
        paramCounter++;
    }
    if (amount) {
        query += ` AND amount = $${paramCounter}`;
        params.push(amount);
        paramCounter++;
    }

    // Date range filtering
    if (date_since) {
        query += ` AND date >= $${paramCounter}`;
        params.push(date_since);
        paramCounter++;
    }
    if (date_to) {
        query += ` AND date <= $${paramCounter}`;
        params.push(date_to);
        paramCounter++;
    }

    // Fiscal year filtering
    if (year) {
        // If a specific year is provided, filter by that year and quarters (if provided)
        if (quarters) {
            const quartersArray = JSON.parse(quarters); // Parse the quarters string into an array
            const quarterClauses = [];

            quartersArray.forEach(quarter => {
                let startDate, endDate;
                switch (quarter) {
                    case 'Q1':
                        startDate = `${year}-01-01`;
                        endDate = `${year}-03-31`;
                        break;
                    case 'Q2':
                        startDate = `${year}-04-01`;
                        endDate = `${year}-06-30`;
                        break;
                    case 'Q3':
                        startDate = `${year}-07-01`;
                        endDate = `${year}-09-30`;
                        break;
                    case 'Q4':
                        startDate = `${year}-10-01`;
                        endDate = `${year}-12-31`;
                        break;
                }

                quarterClauses.push(`(date >= $${paramCounter} AND date <= $${paramCounter + 1})`);
                params.push(startDate, endDate);
                paramCounter += 2;
            });

            if (quarterClauses.length > 0) {
                query += ` AND (${quarterClauses.join(' OR ')})`;
            }
        } else {
            // If no quarters are provided, filter by the entire year
            query += ` AND date >= $${paramCounter} AND date <= $${paramCounter + 1}`;
            params.push(`${year}-01-01`, `${year}-12-31`);
            paramCounter += 2;
        }
    } else {
        // If no year is provided, default to the current fiscal year
        const now = new Date();
        const currentYear = now.getFullYear();
        const fiscalStart = new Date(currentYear - (now.getMonth() < 6 ? 1 : 0), 6, 1); // July 1st of the previous year
        const fiscalEnd = new Date(currentYear + (now.getMonth() < 6 ? 0 : 1), 5, 30); // June 30th of the current year

        query += ` AND date >= $${paramCounter} AND date <= $${paramCounter + 1}`;
        params.push(fiscalStart.toISOString().split('T')[0], fiscalEnd.toISOString().split('T')[0]);
        paramCounter += 2;
    }

    query += ' ORDER BY date DESC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching filtered data:', error);
        res.status(500).send('Error retrieving data');
    }
});






app.post('/api/add-transaction', async (req, res) => {
    const { date, amount, department, name, description, is_recurring_expense } = req.body;

    try {
        // Normalize date to ensure consistency
        const normalizedDate = new Date(date).toISOString().split('T')[0]; // Converts to YYYY-MM-DD format in UTC
        const result = await pool.query(
            'INSERT INTO transactions (date, amount, department, name, description, is_recurring_expense) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [normalizedDate, amount, department, name, description, is_recurring_expense]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).send('Error adding transaction');
    }
});


// Delete transaction by ID
app.delete('/api/delete-transaction/:id', async (req, res) => {
    const transactionId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [transactionId]);
        if (result.rowCount === 0) {
            res.status(404).send(`Transaction ID ${transactionId} not found.`);
        } else {
            res.status(200).json({ message: `Transaction ID ${transactionId} deleted successfully.` });
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).send('Error deleting transaction');
    }
});

// *************************FISCAL YEAR TOTALS TABLE************************************************
// ****************************************************************************************

// New endpoint to fetch fiscal year totals
app.get('/api/fiscal-year-totals', async (req, res) => {
    try {
        // Fetch all transactions
        const result = await pool.query('SELECT * FROM transactions');

        // Group transactions by fiscal year and calculate totals
        const fiscalYearTotals = {};
        result.rows.forEach(transaction => {
            const date = new Date(transaction.date);
            const isNextFiscalYear = (date.getMonth() > 5) || (date.getMonth() === 5 && date.getDate() === 30);
            const fiscalYear = isNextFiscalYear ? 
                `${date.getFullYear()}-${date.getFullYear() + 1}` : 
                `${date.getFullYear() - 1}-${date.getFullYear()}`;

            if (!fiscalYearTotals[fiscalYear]) {
                fiscalYearTotals[fiscalYear] = 0;
            }
            fiscalYearTotals[fiscalYear] += parseFloat(transaction.amount || 0);
        });

        // Convert to an array of objects and sort by fiscal year
        const fiscalYearTotalsArray = Object.entries(fiscalYearTotals)
            .map(([fiscalYear, total]) => ({
                fiscalYear,
                total
            }))
            .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));

        res.json(fiscalYearTotalsArray);
    } catch (error) {
        console.error('Error fetching fiscal year totals:', error);
        res.status(500).send('Error retrieving fiscal year totals');
    }
});

// ****************************************************************************************
// ****************************************************************************************



// *************************INVENTORY TABLE************************************************
// ****************************************************************************************

app.post('/api/add-item', async (req, res) => {
    const { date, item, quantity } = req.body;
    
    try {
        const normalizedDate = new Date(date).toISOString().split('T')[0];
        const result = await pool.query(
            'INSERT INTO inventory (item, quantity, last_update) VALUES ($1, $2, $3) RETURNING *',
            [item, quantity, normalizedDate]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).send('Error adding item');
    }
});

// Get all inventory items
app.get('/api/inventory', async (req, res) => {

    try {
        const result = await pool.query('SELECT * FROM inventory');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).send('Error retrieving inventory');
    }
});

// Delete inventory item
app.delete('/api/delete-item/:item', async (req, res) => {
    const itemId = req.params.item;

    try {
        const result = await pool.query('DELETE FROM inventory WHERE item = $1 RETURNING *', [itemId]);
        if (result.rowCount === 0) {
            res.status(404).send(`Item, ${itemId}, not found.`);
        } else {
            res.status(200).json({ message: `Item, ${itemId}, deleted successfully.` });
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).send('Error deleting item');
    }
});

// Update inventory item quantity
app.put('/api/update-quantity/:item', async (req, res) => {
    const itemId = req.params.item;
    const { quantity } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const result = await pool.query(
            'UPDATE inventory SET quantity = $1, last_update = $2 WHERE item = $3 RETURNING *',
            [quantity, today, itemId]
        );
        if (result.rowCount === 0) {
            res.status(404).send(`Item, ${itemId}, not found.`);
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        // Error handling code
    }
});


// ****************************************************************************************
// ****************************************************************************************

app.get('/api/get-budget', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM budget');
        res.json(result.rows); // Make sure this returns JSON
    } catch (err) {
        console.error('Error fetching budget:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// UPDATE Budget in database
app.put('/api/update-budget', async (req, res) => {
    try {
        const { totalBudget } = req.body;
        await pool.query('UPDATE budget SET total_budget = $1 WHERE id = (SELECT id FROM budget LIMIT 1)', [totalBudget]);
        res.json({ message: "Budget updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating budget" });
    }
});


// ****************************************************************************************
// ****************************************************************************************


// ✅ GET All Department Budgets
app.get('/api/department-budgets', async (req, res) => {
    try {
        const result = await pool.query('SELECT department, allowance FROM department_budgets ORDER BY department');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching department budgets:", err);
        res.status(500).json({ error: "Error retrieving department budgets" });
    }
});

// ✅ UPDATE Department Budget (Allowance)
app.put('/api/update-department-budget', async (req, res) => {
    const { department, allowance } = req.body;

    try {
        const result = await pool.query(
            'UPDATE department_budgets SET allowance = $1 WHERE department = $2 RETURNING *',
            [allowance, department]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Department not found" });
        }

        res.json({ message: "Department budget updated successfully", department, allowance });
    } catch (err) {
        console.error("Error updating department budget:", err);
        res.status(500).json({ error: "Failed to update department budget" });
    }
});

// ✅ DELETE Department
app.delete('/api/delete-department/:department', async (req, res) => {
    const department = decodeURIComponent(req.params.department);

    try {
        const result = await pool.query('DELETE FROM department_budgets WHERE department = $1 RETURNING *', [department]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Department not found" });
        }

        res.json({ message: `Department '${department}' deleted successfully` });
    } catch (err) {
        console.error("Error deleting department:", err);
        res.status(500).json({ error: "Failed to delete department" });
    }
});




// ****************************************************************************************
// ****************************************************************************************


// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});