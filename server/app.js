const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// MySQL Connection Configuration
let db_config = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  port: process.env.DB_PORT 
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      setTimeout(handleDisconnect, 2000); // Reconnect after 2 seconds
    } else {
      console.log('Connected to MySQL database');
    }
  });

  connection.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// CRUD operations

app.post('/create', (req, res) => {
  const { name, email, phone } = req.body;
  connection.query("INSERT INTO user (name, email, phone) VALUES (?, ?, ?)", [name, email, phone], (error, results) => {
    if (error) {
      console.error('Error inserting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating user!',
      });
    }
    console.log('Successfully created user:', results);
    res.status(200).json({
      success: true,
      message: 'Successfully created user!',
    });
  });
});

// Fetching users
app.get('/list', (req, res) => {
  connection.query("SELECT * FROM user", (error, result) => {
    if (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching the users',
      });
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  });
});

// Deleting a user
app.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM user WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error in deleting user:', err);
      return res.status(500).json({
        success: false,
        message: 'Error in deleting the user',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Successfully deleted the user!',
    });
  });
});

// Updating a user
app.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  connection.query(
    "UPDATE user SET name = ?, email = ?, phone = ? WHERE id = ?",
    [name, email, phone, id],
    (error, results) => {
      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
          success: false,
          message: 'Error updating user!',
        });
      }
      console.log('Successfully updated user:', results);
      res.status(200).json({
        success: true,
        message: 'Successfully updated user!',
      });
    }
  );
});

// Endpoint to check server status
app.get('/status', (req, res) => {
  res.status(200).json({
    message: 'Server is running successfully!',
  });
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running`);
});
