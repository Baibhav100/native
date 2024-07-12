const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Creating a MySQL connection
const con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB, // Ensure the correct key: database
});

con.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// CRUD operations

app.post('/create', (req, res) => {
  const { name, email, phone } = req.body;
  con.query("INSERT INTO user (name, email, phone) VALUES (?, ?, ?)", [name, email, phone], (error, results) => {
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
  con.query("SELECT * FROM user", (error, result) => {
    if (error) {
      console.log("Error fetching users:", error);
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

//deleting a user

app.delete('/delete/:id',(req,res)=>{
  const {id}=req.params;

  con.query('delete from user where id=?',[id],(err,result)=>{
    if(err){
      console.log('error in deleting');
      return res.status(500).json({
        success:false,
        message:'error in deleting the user',

      });
    }
   res.status(200).json({
    success:true,
    message:'successfully deleted the user!'
   });
  });

});
//update the users

app.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  con.query(
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

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
