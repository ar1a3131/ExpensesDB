
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

// *************************INVENTORY TABLE************************************************
// ****************************************************************************************

app.post('/api/add-item', async (req, res) => {
    const { date, name, quantity } = req.body;
    
    try {
        const normalizedDate = new Date(date).toISOString().split('T')[0];
        const result = await pool.query(
            'INSERT INTO inventory (date, item, quantity) VALUES ($1, $2, $3) RETURNING *',
            [normalizedDate, name, quantity]
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
app.delete('/api/delete-item/:id', async (req, res) => {
    const itemId = req.params.id;
    
    try {
        const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [itemId]);
        if (result.rowCount === 0) {
            res.status(404).send(`Item ID ${itemId} not found.`);
        } else {
            res.status(200).json({ message: `Item ID ${itemId} deleted successfully.` });
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).send('Error deleting item');
    }
});

// Update inventory item quantity
app.put('/api/update-item/:id', async (req, res) => {
    const itemId = req.params.id;
    const { quantity } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE inventory SET quantity = $1 WHERE id = $2 RETURNING *',
            [quantity, itemId]
        );
        if (result.rowCount === 0) {
            res.status(404).send(`Item ID ${itemId} not found.`);
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).send('Error updating item');
    }
});

// ****************************************************************************************
// ****************************************************************************************

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});