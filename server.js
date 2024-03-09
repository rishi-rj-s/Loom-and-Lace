const express =require('express');
 const dotenv= require('dotenv');
 const morgan= require('morgan');
 const bodyparser= require('body-parser');
 const path=require('path');
 const session= require('express-session');
 const { v4:uuidv4 } = require('uuid');
 const nocache = require("nocache");  
 const jwt = require('jsonwebtoken');
 const cookieParser = require('cookie-parser');
 const passport= require('passport');
 require('passport-google-oauth20').Strategy
 require('./server/middleware/auth');

 const connectDB =require('./server/database/connection')

 const app = express();
app.use(express.json());
 

 dotenv.config({path:'config.env'})
 const PORT= process.env.PORT||8080

 //log requests
 app.use(morgan('dev'));
//mongodb connection
connectDB();
 //parse request to body
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}))

app.use(nocache());
app.use(cookieParser());

//set view engine
app.set("view engine","ejs")

app.use(session({
    secret : uuidv4(),
    cookie: {maxAge: 3600000},
    resave :false,
    saveUninitialized:true
}))
app.use(passport.initialize());
app.use(passport.session());


app.use('/uploads',express.static('uploads'));
//load assets
app.use('/static',express.static(path.join(__dirname,'assets')))

app.use('/css',express.static(path.resolve(__dirname,"assets/css")))
app.use('/img',express.static(path.resolve(__dirname,"assets/img")))
app.use('/js',express.static(path.resolve(__dirname,"assets/js")))

app.use('/',require("./server/routes/router"))

app.get('/', async (req, res) => {
    res.redirect('/home');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async(req, res) => {
    const userToken = req.user.userToken;
    const decodedToken = jwt.verify(userToken, 'your_secret_key');
    req.session.email = decodedToken.userId;
    res.cookie('userToken', userToken);
    res.redirect('/home');
});



 app.listen(PORT,()=>{ console.log(`Server is running on http://localhost:${PORT}`)})