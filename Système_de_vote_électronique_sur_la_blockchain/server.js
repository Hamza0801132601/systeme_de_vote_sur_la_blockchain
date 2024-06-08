const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const Web3 = require('web3');
const contract = require('@truffle/contract');
const votingArtifacts = require('./build/contracts/Voting.json');
const VotingContract = contract(votingArtifacts);

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root', // replace with your MySQL password
  database: 'voter_db'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

// Create table if not exists
const createTableQuery = `CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_name VARCHAR(255) NOT NULL,
  candidate_id VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL
)`;

db.query(createTableQuery, (err, result) => {
  if (err) {
    throw err;
  }
  console.log('Candidates table created or exists already');
});

// Set up Web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
VotingContract.setProvider(web3.currentProvider);

// Authorization middleware
const authorizeUser = (req, res, next) => {
  const token = req.query.Authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).send('<h1 align="center"> Login to Continue </h1>');
  }

  try {
    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });

    req.user = decodedToken;
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
};

// Serve static files and pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

app.get('/add.js', (req, res) => {
  res.sendFile(path.join(__dirname, '/add.js'));
});

app.get('/js/login.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/login.js'))
});

app.get('/css/login.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/login.css'))
});

app.get('/css/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/index.css'))
});

app.get('/css/admin.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/admin.css'))
});

app.get('/css/form.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/form.css'))
});

app.get('/assets/ensias.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/ensias.jpg'))
});

app.get('/js/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/app.js'))
});

app.get('/admin.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/admin.html'));
});

app.get('/index.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

app.get('/candidate_form.html',  (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/candidate_form.html'));
});

app.get('/dist/login.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/login.bundle.js'));
});

app.get('/dist/app.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/app.bundle.js'));
});

// Serve the favicon.ico file
app.get('/adei.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/adei.ico'));
});

// Route to handle candidate form submission
app.post('/submit-candidacy', (req, res) => {
  const { candidateName, candidateId, position } = req.body;

  const query = 'INSERT INTO candidates (candidate_name, candidate_id, position) VALUES (?, ?, ?)';
  db.query(query, [candidateName, candidateId, position], (err, result) => {
    if (err) {
      res.status(500).send('Server error');
      throw err;
    }
    res.send('Candidate information saved successfully');
  });
});

// Route to transfer candidates from DB to blockchain
app.get('/transfer-candidates', authorizeUser, async (req, res) => {
  try {
    const account = await web3.eth.getAccounts().then(accounts => accounts[0]);
    VotingContract.defaults({ from: account, gas: 6654755 });

    db.query('SELECT * FROM candidates', async (err, results) => {
      if (err) {
        return res.status(500).send('Database error');
      }

      const contractInstance = await VotingContract.deployed();

      for (const candidate of results) {
        await contractInstance.addCandidate(candidate.candidate_name, candidate.position);
      }

      res.send('Candidates transferred to blockchain successfully');
    });
  } catch (error) {
    res.status(500).send('Error transferring candidates to blockchain');
  }
});

// Call the function to transfer candidates to blockchain
// Route to retrieve candidate names from the database
app.get('/candidates', (req, res) => {
  const query = 'SELECT candidate_name FROM candidates';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Database error');
      throw err;
    }
    const candidateNames = results.map(row => row.candidate_name);
    res.json(candidateNames);
  });
});




// Start the server
app.listen(8080, () => {
  console.log('Server listening on http://localhost:8080');
});
