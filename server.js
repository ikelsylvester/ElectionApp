const express = require("express");
const session= require("express-session")
const path = require("path");
const bodyParser = require("body-parser");
const sqlite3 = require('sqlite3').verbose();


const app = express();
const port = 3000;
app.use(session({
  secret: 'your-secret-key',  // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }   // Set to true if you're using HTTPS
}));



app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "Public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// SQLite database initialization
const db = new sqlite3.Database('./election.db');

// Database schema creation
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS auth( id INTEGER  PRIMARY KEY AUTOINCREMENT, username VARCHAR(50) NOT NULL, password VARCHAR(50) NOT NULL, user_id INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS roles( id INTEGER  PRIMARY KEY AUTOINCREMENT, role VARCHAR(50) NOT NULL)');
    db.run('CREATE TABLE IF NOT EXISTS users( id INTEGER  PRIMARY KEY AUTOINCREMENT, first_name VARCHAR(50) NOT NULL, middle_name VARCHAR(50) NULL, last_name VARCHAR(50) NOT NULL,DOB DATE NOT NULL, photo BLOB,role_id INT)');
    db.run('CREATE TABLE IF NOT EXISTS parties( id INTEGER  PRIMARY KEY AUTOINCREMENT, party VARCHAR(50) NOT NULL, logo BLOB)');
    db.run('CREATE TABLE IF NOT EXISTS positions( id INTEGER  PRIMARY KEY AUTOINCREMENT, position VARCHAR(50) NOT NULL, logo BLOB)');
    db.run('CREATE TABLE IF NOT EXISTS candidates( id INTEGER  PRIMARY KEY AUTOINCREMENT, first_name VARCHAR(50) NOT NULL, middle_name VARCHAR(50) NULL, last_name VARCHAR(50) NOT NULL, position_id INTEGER NOT NULL, party_id INTEGER NOT NULL, photo BLOB)');
    db.run('CREATE TABLE IF NOT EXISTS votes( id INTEGER  PRIMARY KEY AUTOINCREMENT, candidate_id INTEGER NOT NULL, vote INTEGER NOT NULL)');
});



// Example users array (for testing purposes)
let users = [];

// Route to render dashboard
 
 app.get("/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login2"); // Redirect if not authenticated
  }

  const sqlCandidates = `
    SELECT candidates.*, parties.party, parties.logo, positions.position, IFNULL(votes.vote, 0) AS vote
    FROM candidates
    JOIN parties ON candidates.party_id = parties.id
    JOIN positions ON candidates.position_id = positions.id
    LEFT JOIN votes ON candidates.id = votes.candidate_id
  `;

  const sqlTotalVotesPerPosition = `
    SELECT positions.position, SUM(IFNULL(votes.vote, 0)) AS totalVotes
    FROM candidates
    JOIN positions ON candidates.position_id = positions.id
    LEFT JOIN votes ON candidates.id = votes.candidate_id
    GROUP BY positions.position
  `;

  db.get("SELECT COUNT(username) AS totalUsers FROM auth", [], (err, result) => {
    if (err) {
      console.error("Error fetching total users:", err.message);
      return res.status(500).send("Error fetching total users");
    }
    const totalUsers = result.totalUsers;
    const profilePicture = req.session.profilePicture;

    db.all(sqlTotalVotesPerPosition, [], (err, totalVotesPerPosition) => {
      if (err) {
        console.error("Error fetching total votes per position:", err.message);
        return res.status(500).send("Error fetching total votes per position");
      }

      const totalVotesMap = {};
      totalVotesPerPosition.forEach((row) => {
        totalVotesMap[row.position] = row.totalVotes || 0;
      });

      db.all(sqlCandidates, [], (err, candidates) => {
        if (err) {
          console.error("Error fetching candidates data:", err.message);
          return res.status(500).send("Error fetching candidates data");
        }

        candidates = candidates.map((candidate) => {
          return {
            ...candidate,
            photo: candidate.photo ? candidate.photo.toString("base64") : null,
            logo: candidate.logo ? candidate.logo.toString("base64") : null,
            votePercentage: totalVotesMap[candidate.position] > 0
              ? (candidate.vote / totalVotesMap[candidate.position]) * 100
              : 0,
          };
        });

        const totalVotes = totalVotesPerPosition.reduce((acc, row) => acc + row.totalVotes, 0);

        db.get(
          "SELECT users.role_id, roles.role FROM users JOIN roles ON users.role_id = roles.id WHERE users.id = ?",
          [req.session.userId],
          (err, userRole) => {
            if (err) {
              console.error("Error fetching user role:", err.message);
              return res.status(500).send("Error fetching user role");
            }

            res.render("dashboard", {
              totalUsers,
              profilePicture,
              candidates,
              totalVotes,
              role: userRole.role,
            });
          }
        );
      });
    });
  });
});


// Route to render login form
app.get("/login", (req, res) => {
    res.render("login.ejs");
});
 

// Route to handle login form submission
// app.post("/login", (req, res) => {
//     const { username, password } = req.body;
//     // Example: Check credentials against a database or users array
//     const user = users.find(user => user.username === username && user.password === password);
//     if (user) {
//         res.redirect("/dashboard");
//     } else {
//         res.send("Invalid username or password");
//     }
// });

// Route to render signup form
app.get("/signUp", (req, res) => {
    res.render("signUp.ejs");
});

// Route to handle signup form submission
// app.post("/signUp", (req, res) => {
//     const userData = {
//         username: req.body.username,
//         password: req.body.password,
//         email: req.body.email
//     };
//     // Store user data (example: push to users array)
//     users.push(userData);
//     console.log(`User SignUp:`, userData);
//     res.redirect("/login");
// });

// 

// Route to render voters registration form
app.get("/voters", (req, res)=>{
    
db.all("SELECT * FROM roles", [], (err, roles) => {
    if (err) {
        return res.status(500).send("Internal Server error");
    }
    

db.all("SELECT * FROM parties", [], (err, parties) => {
     if (err) {
        return res.status(500).send("Internal Server error");
    }
    
db.all("SELECT * FROM positions", [], (err, positions) => {
     if (err) {
        return res.status(500).send("Internal Server error");
    }
   
   res.render("voters", {roles, parties, positions})
});
});
});
});
 app.post("/voters", (req, res) => {
    console.log(req.body); // Ensure req.body is populated correctly
    const {firstName, middleName, lastName, dob,profile_photo,username,password,role_id } = req.body;
    db.run(
        "INSERT INTO users(first_name,middle_name,last_name,DOB,photo,role_id) VALUES(?,?,?,?,?,?)",
        [firstName, middleName, lastName,dob,profile_photo,role_id],
        function(err) {
            if (err) {
                return console.error(err.message); // Corrected console.error

            }
            db.run(
                "INSERT INTO auth(username,password,user_id) VALUES (?,?,?)",
                [username,password, this.lastID],
                function(err){
                    if(err){
                        return console.error(err.message);
                    }
                }

            )
            console.log(`A row has been inserted with ID ${this.lastID}`);
            res.redirect("/login2");
        }
    );
});





// db.run("DELETE FROM users");
// db.run("ALTER TABLE users ADD COLUMN first_name boolean NOT NULL");

// Route to render login form
app.get("/login2", (req, res)=>{
    res.render("login2.ejs")
});
 // Route to handle login form submission for login2
app.post("/login2", (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM auth WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            console.error("Error during login:", err.message);
            return res.status(500).send("Internal server error");
        }

        if (row) {
            // If credentials are correct, store user info in session and redirect
            req.session.user = { username: row.username }; // Store user info in session

            console.log("Session data:", req.session); // Debug session data

            return res.redirect("/dashboard");
        } else {
            res.send("Invalid username or password");
        }
    });
});






// Route to render party registration form
app.get("/party_registration", (req, res)=>{
    res.render("Party_registration.ejs")
});
// Handle POST request to /party_registration
app.post("/party_registration", (req, res) => {
    const { partyName, partyLogo } = req.body;

    
    db.run(
        'INSERT INTO parties (party, logo) VALUES (?, ?)',
        [partyName, partyLogo],
        function(err) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`A row has been inserted with rowid ${this.lastID}`);
            // Respond with a success message or redirect as needed
            res.send('Party registered successfully');
        }
    );
});
// Route to render candidates registration form
app.get("/candidates_registration", (req,res)=>{
    res.render("candidates_registration.ejs");
});
// Handle POST request to /Candidates_registration
app.post("/candidates_registration", (req, res)=>{
    const {firstName,middleName,lastName,position,partyID,photo}= req.body;
    console.log(req.body)
    db.run(
        'INSERT INTO candidates (first_name,middle_name,last_name,position_id,party_id,photo) VALUES (?,?,?,?,?,?)',
        [firstName,middleName,lastName,position,partyID,photo],
        function(err) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`A row has been inserted with rowid ${this.lastID}`);
            // Respond with a success message or redirect as needed
            res.send('Candidate registered successfully');
        }
    );
});

// Start server
app.listen(port, () => {
    console.log(`App is listening to port ${port}`);
});