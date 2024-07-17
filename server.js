const express = require("express");
const path = require ("path")
const bodyparser =require("body-parser")
const app = express();
const port= 3000;



app.set("view engine", "ejs")
app.use(express.static((path.join(__dirname, "Public"))))
app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json())
let users= []

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./election.db')

db.serialize(() => {
   db.run('CREATE TABLE IF NOT EXISTS auth( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL, password VARCHAR(50) NOT NULL, user_id INT)');

   db.run('CREATE TABLE IF NOT EXISTS roles( id INT AUTO_INCREMENT PRIMARY KEY, role VARCHAR(50) NOT NULL)');

   db.run('CREATE TABLE IF NOT EXISTS users( id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50) NOT NULL,   middle_name VARCHAR(50) NULL,last_name VARCHAR(50) NOT NULL, DOB DATE NOT NULL)');

   db.run('CREATE TABLE IF NOT EXISTS parties( id INT AUTO_INCREMENT PRIMARY KEY, party VARCHAR(50) NOT NULL,logo blob)');

   db.run('CREATE TABLE IF NOT EXISTS positions( id INT AUTO_INCREMENT PRIMARY KEY, position VARCHAR(50) NOT NULL,logo blob)');

   db.run('CREATE TABLE IF NOT EXISTS candidates( id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(50) NOT NULL,   middle_name VARCHAR(50) NULL,last_name VARCHAR(50) NOT NULL, position_id INT NOT NULL,party_id INT NOT NULL, photo blob )');

   db.run('CREATE TABLE IF NOT EXISTS votes( id INT AUTO_INCREMENT PRIMARY KEY, candidate_id INT NOT NULL, vote INT NOT NULL )');

  db.each('SELECT * FROM auth', (err, row) => {
    console.log(row)
  }) 
})

db.close()

app.get("/dashboard", (req,res)=>{
    res.render("dashboard.ejs")
})
app.get("/login", (req,res)=>{
    res.render("login.ejs")
})
app.post("/login", (req,res)=>{   

    const {username, password}=req.body
   

    const user= users.find(user=>user.username===username && user.password=== password);
    if(user){
        res.redirect("/dashboard")
    }else{
        res.redirect("Invalid name or password")
    }
});


app.get("/signUp", (req,res)=>{
    res.render("signUp.ejs")
})
app.post("/signUp",(req,res)=>{
    const userData={
        username:req.body.username,
        password:req.body.password,
        email:req.body.email,
    };
    //Store user data
    users.push(userData);
    console.log(`User SignUp:`, userData)
     res.redirect("/login")
})
 

app.listen(port,()=>{
    console.log(`App is listening to port ${port}`)
})
