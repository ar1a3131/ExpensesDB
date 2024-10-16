const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5000;

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'BudgetDB',
    password: 'Trace-Reroute4',
    port: 8080, // Default PostgreSQL port = 5432
});

// Routes
app.get('/api/rows', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving data from the database');
    }
});

app.post('/api/add-transaction', async (req, res) => {
    const { date, amount, department, name, description, is_recurring_expense } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (date, amount, department, name, description, is_recurring_expense) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [date, amount, department, name, description, is_recurring_expense]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).send('Error adding transaction');
    }
});

const PORT = process.env.PORT || 5000; //added
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});