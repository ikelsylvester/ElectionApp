const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const sqlite3 = require('sqlite3').verbose();



const app = express();
const port = 3000;



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
    res.render("dashboard.ejs");
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
    db.all("SELECT * FROM roles",function(err,row){
    res.render("voters.ejs",{row})

    })
});
 app.post("/voters", (req, res) => {
    console.log(req.body); // Ensure req.body is populated correctly
    const {firstName, middleName, lastName, dob,profile_photo,username,password,role_id } = req.body;
    db.run(
        "INSERT INTO users VALUES(?,?,?,?,?,?,?)",
        [null,firstName, middleName, lastName,dob,profile_photo,role_id],
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
    // Here you should check credentials against your database
    // This example assumes you have a database setup (SQLite in your case)
    db.get('SELECT * FROM auth WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            // If credentials are correct, redirect to dashboard
            res.redirect("/dashboard");
        } else {
            // If credentials are incorrect, handle as needed (e.g., show error message)
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
// app.get("/candidates_registration", (req,res)=>{
//     res.render("candidates_registration.ejs");
// });
// // Handle POST request to /Candidates_registration
// app.post("/candidates_registration", (req, res)=>{
//     const {firstName,middleName,lastName,position,partyID,photo}= req.body;
//     db.run("INSERT INTO candidates( first_name, middle_name, last_name,postion_id,photo) VALUES(?,?,?,?,?,?,?)"
//        [ firstName, middleName, lastName, position, partyID, photo],
//     function(err){

//         if(err){
//           return console.err(err.message);
//         }
//          res.send('Candidate registered successfully');
//      });
// });

// Start server
app.listen(port, () => {
    console.log(`App is listening to port ${port}`);
});