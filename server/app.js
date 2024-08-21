const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const bcrypt = require('bcrypt');


dotenv.config();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// MySQL Connection Configuration
let db_config = {
  host: process.env.HOST || 'localhost',
  user: process.env.USER || 'root',
  password: process.env.PASSWORD || '',
  database: process.env.DB || 'practise',
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

//pharmacy details
app.get('/api/pharmacy/:pharmacyId',(req,res)=>{
  const pharmacyId= req.params.pharmacyId;
  const query='select phar_name as name, phar_location as location , phar_phone as contact from pharmacy where phar_id = ?';
  connection.query(query,[pharmacyId],(err,results)=>{
    if(err){
      console.error("error querying the database",err);
      return res.status(500).json({error:'server error'});
    }
    if(results.length==0){
      return res.status(404).json({error:'Pharmacy not found'});
    }

    const pharmacy = results[0];
    res.status(200).json(pharmacy);
})
})

app.get('/med', (req, res) => {
  connection.query("SELECT id, name FROM medicines", (error, result) => {
    if (error) {
      console.error("Error fetching medicines:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching the medicines',
      });
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  });
});

//signing up a user
app.post('/api/user', async (req, res) => {
  const { name, email, phone, address, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO user (name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [name, email, phone, address, hashedPassword], (err, result) => {

      if (err) {
        console.error('Error inserting user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//adding the pharmacy
app.post('/api/pharmacy',async(req,res)=>{
  const{pharname, location, contactNo, password, confirmPassword}=req.body;
  if(password !==confirmPassword){
    return res.status(400).json({error:'Passwords do not match !'})
  }
  try{
    const hashedpassword = await bcrypt.hash(password,10);
    const query = 'insert into pharmacy (phar_name,phar_location,phar_phone,phar_password) values (?,?,?,?)';
    connection.query(query,[pharname,location,contactNo,hashedpassword],(err,result)=>{
      if(err){
        console.error('Error inserting data',err);
        return res.status(500).json({error:'Database error'});
      }
      res.status(201).json({message:'User registered succesfully'});
    });

  }
  catch(error){
    console.error('Error during user registration:', error);
    res.status(500).json({error:'Internal server error'});

  }
});     
//logging up a user
app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Please enter all the fields!' });
  }

  try {
    // First, check the user table
    connection.query('SELECT * FROM user WHERE name = ?', [name], (err, userResult) => {
      if (err) {
        console.error('Error querying the user table:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (userResult.length > 0) {
        // User found in user table
        const user = userResult[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            return res.status(500).json({ error: 'Server error' });
          }

          if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password. Please check again!' });
          }

          return res.status(200).json({ 
            message: 'Successfully logged in!', 
            success: true, 
            userType: 'user' 
          });
        }); 
      } else {
        // If no user is found in the user table, check the pharmacy table
        connection.query('SELECT * FROM pharmacy WHERE phar_name = ?', [name], (err, pharResult) => {
          if (err) {
            console.error('Error querying the pharmacy table:', err);
            return res.status(500).json({ error: 'Server error' });
          }

          if (pharResult.length === 0) {
            return res.status(401).json({ error: 'Invalid name or password!' });
          }

          const pharmacy = pharResult[0];
          bcrypt.compare(password, pharmacy.phar_password, (err, isMatch) => {
            if (err) {
              console.error('Error comparing passwords:', err);
              return res.status(500).json({ error: 'Server error' });
            }

            if (!isMatch) {
              return res.status(401).json({ error: 'Incorrect password. Please check again!' });
            }

            return res.status(200).json({ 
              message: 'Successfully logged in!', 
              success: true, 
              userType: 'pharmacy',
              pharmacyId: pharmacy.phar_id 
            });
          });
        });
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// fetching data of the pharmacy using its id




//fetch users
app.get('/getAddress', (req, res) => {
  const username = req.query.username; // Assuming you pass the username as a query parameter
  const query = 'SELECT address FROM user WHERE name = ?';

  connection.query(query, [username], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


app.get('/status', (req, res) => {
  res.status(200).json({
    message: 'Server is running successfully!',
  });
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running`);
});
