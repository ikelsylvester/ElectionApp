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
