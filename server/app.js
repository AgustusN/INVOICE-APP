  const express = require('express');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const mysql = require('mysql');
  const dotenv = require('dotenv');
  const bcrypt = require('bcrypt');


  dotenv.config();

  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
    }
    console.log('Connected to the MySQL database');
  });

  // get all users
  app.get('/api/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: err });
      } else {
        res.status(200).json(results);
      }
    });
  });


  // Create a new user
  app.post('/api/users', async (req, res) => {
      const { name, email, password, role } = req.body;
      
      // Check if all fields are provided
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
    
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
    
      // Insert the new user into the database :)
      const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      const values = [name, email, hashedPassword, role];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ error: err });
        } else {
          res.status(201).json({ message: 'User created successfully', userId: result.insertId });
        }
      });
    });

    // Fetch all invoices
    app.get('/api/invoices', (req, res) => {
      const sql = 'SELECT * FROM invoices';
    
      db.query(sql, (err, results) => {
        if (err) {
          res.status(500).json({ error: err });
        } else {
          res.status(200).json(results);
        }
      });
    });
    
    // Create an invoice
  app.post('/api/invoices', (req, res) => {
      const { description, amount, due_date } = req.body;
    
      if (!description || !amount || !due_date) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
    
      const sql = 'INSERT INTO invoices (description, amount, due_date) VALUES (?, ?, ?)';
      const values = [description, amount, due_date];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ error: err });
        } else {
          res.status(201).json({ invoiceId: result.insertId });
        }
      });
    });
    
    // Assign an invoice to a user
    app.post('/api/user_invoices', (req, res) => {
      const { user_id, invoice_id } = req.body;
    
      if (!user_id || !invoice_id) {
        return res.status(400).json({ error: 'Both user_id and invoice_id are required.' });
      }
    
      const sql = 'INSERT INTO user_invoices (user_id, invoice_id) VALUES (?, ?)';
      const values = [user_id, invoice_id];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ error: err });
        } else {
          res.status(201).json({ message: 'Invoice assigned to user successfully' });
        }
      });
    });
    
    // Get all invoices with the assigned users
  app.get('/api/invoices_users', (req, res) => {
      const sql = `SELECT invoices.id AS invoice_id, invoices.description, invoices.amount, invoices.due_date,
                  users.id AS user_id, users.name, users.email, users.role
                  FROM invoices
                  INNER JOIN user_invoices ON invoices.id = user_invoices.invoice_id
                  INNER JOIN users ON users.id = user_invoices.user_id`;
    
      db.query(sql, (err, results) => {
        if (err) {
          res.status(500).json({ error: err });
        } else {
          res.status(200).json(results);
        }
      });
    });
  
  // Get invoices assigned to a user
  app.get('/api/user_invoices/:userId', (req, res) => {
      const { userId } = req.params;
    
      const sql = `SELECT invoices.id, invoices.description, invoices.amount, invoices.due_date
                  FROM invoices
                  INNER JOIN user_invoices ON invoices.id = user_invoices.invoice_id
                  WHERE user_invoices.user_id = ?`;
    
      db.query(sql, [userId], (err, results) => {
        if (err) {
          res.status(500).json({ error: err });
        } else {
          res.status(200).json(results);
        }
      });
    });
    
    

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
