const axios= require('axios');
const Userdb = require('../model/model');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
require('../middleware/auth');
const passport = require('passport');

exports.home=async(req,res)=>{
    try {
        // Fetch products and categories from the database
        const products = await Productdb.find();
        const categories = await Categorydb.find();
        if (req.cookies.adminToken) {
            // If token exists, redirect to the manage page
            res.redirect('/admin/manage');
        } else
         if (req.cookies.userToken) {
            try {
                const email= req.session.email;
                const user = await Userdb.findOne({ email: email });
                // Define userToken with the token value
                const userToken = req.cookies.userToken;

                // Render the login page with user information
                res.render('index', { userToken: userToken, products: products, categories: categories,user: user });
            } catch (error) {
                // If token verification fails, redirect to the index page
                console.error(error);
                res.render('index', { title: "LOOM", products: products, categories: categories });
            }
        } else {
            // If no token is present, render the index page
            res.render('index', { userToken: undefined, products: products, categories: categories });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
exports.loginpage=(req,res)=>{
    if(req.cookies.userToken)
    {
        res.redirect("/");
    }
    else if(req.cookies.adminToken){
        res.redirect("/admin/manage")
    }
    else{
    res.render('login')
    }
}

exports.login = async (req, res) => {
    try {
        const user = await Userdb.findOne({ email: req.body.email });
        const products=await Productdb.find({});
        const categories=await Categorydb.find({});
        console.log("user",req.cookies.email)
        if(req.cookies.userToken){
            res.render('index',{ title: "LOOM", products: products, categories: categories });
        }
        else if(req.cookies.adminToken){
            res.redirect('/admin/manage');
        }
        else if (user && user.status === "active") {
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err) {
                    console.error(err);
                    res.redirect('/?error=login_failed');
                    return;
                }
                if (result) {
                    // Create a JWT token
                    const userToken = jwt.sign(
                        { email: req.body.email }, 
                        'your_secret_key', 
                        { expiresIn: '1h' } // Token expires in 1 hour
                    );
                    // Set the token in the response cookie or header, as per your requirement
                    res.cookie('userToken', userToken);
                    
                    delete req.session.uname;
                    delete req.session.uemail;
                    delete req.session.upass;
                    delete req.session.gender;
                    req.session.email= req.body.email;
                    res.redirect('/home');
                } else {
                    res.redirect('/loginpage?pass=wrong');
                }
            });
        } else {
            res.redirect('/loginpage?pass=wrong');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/?error=login_failed');
    }
};

// Route for verifyingg OTP via email
exports.verify = (req, res) => {
    if (req.cookies.userToken) {
        res.redirect('/');
    } else if (req.cookies.adminToken) {
        res.redirect('/admin/manage');
    } else if (req.session.otp && req.body.otp == req.session.otp) {
        bcrypt.hash(req.session.upass, 10, (err, hashedPassword) => {
            if (err) {
                res.status(500).send({
                    message: err.message || "Some error occurred while hashing the password"
                });
                return;
            }

            const user = new Userdb({
                name: req.session.uname,
                email: req.session.uemail,
                password: hashedPassword,
                gender: req.session.gender,
            });

            delete req.session.otp;
            //save user in db
            user.save(user)
                .then(data => {
                    res.redirect('/loginpage');
                })
                .catch(err => {
                    res.status(500).send({
                        message: err.message || "Some error occurred while creating operation"
                    });
                });
        });
    } else {
        res.render('otp', { message: 'OTP is not matching!' });
    }
};

exports.signup=(req,res)=>{
    if(req.cookies.userToken)
    {
        res.redirect("/");
    }
    else if(req.cookies.adminToken){
        res.redirect("/admin/manage")
    }
    else{
    res.render('signup', { message: '' })
    }
}

exports.adminlogin = (req, res) => {
    if(req.cookies.userToken) {
        res.redirect("/");
    } else if(req.cookies.adminToken) {
        res.redirect("/admin/manage");
    } else {
        try {
            const credential = {
                email: 'admin@gmail.com',
                password: 'password',
            };
    
            if(req.body.email == credential.email && req.body.password == credential.password) { 
                const adminToken = jwt.sign(
                    { email: credential.email, role: 'admin' }, 
                    'your_secret_key', 
                    { expiresIn: '1h' } // Token expires in 1 hour
                );
                
                // Set the token in the response cookie or header, as per your requirement
                res.cookie('adminToken', adminToken);

                // Set the admin token in the session for further usage
                req.session.admin = adminToken;
                res.redirect("/admin/manage");
            } else {
                res.redirect('/admin?pass=wrong');
            }
        } catch (error) {
            console.error(error);
            res.redirect('/?error=login_failed');
        }
    }
};


exports.admin = (req, res) => {
    if ( req.cookies.adminToken) {
        // If token exists, redirect to the manage page
        res.redirect('/admin/manage');
    } else {
        // If token doesn't exist, render the admin login page
        res.render('adminlogin');
    }
};

exports.manage=(req,res)=>{
    if(req.cookies.userToken){
        res.redirect('/');
    }
    else if(req.cookies.adminToken){
    res.render('admindashboard')
    }
    else{
        res.redirect('/');
    }
}

exports.users = (req, res) => {
    if (req.cookies.adminToken) {
                // Make a GET request to /api/users
                axios.get('http://localhost:3000/api/users')
                    .then(function (response) {
                        res.render('usermanage', { users: response.data });
                    })
                    .catch(err => {
                        res.send(err);
                    });
            }
    else {
         res.redirect('/');;
    }
};
exports.block=async (req, res) => {
    try {
        const userId = req.query.id; // Assuming you get the user ID from the query parameter
        const user = await Userdb.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Toggle user status (assuming 'active' and 'blocked' are the possible statuses)
        user.status = user.status === 'active' ? 'blocked' : 'active';

        await user.save(); // Save the updated user

        // Redirect back to the user list page
        res.redirect('/admin/users'); // Adjust the actual route as needed
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).send('Error occurred while updating user status');
    }
}

exports.logout=(req,res)=>{
    req.session.destroy(function(err){
       if(err){
          console.log(err);
          res.send("Error")
       }else{
           res.clearCookie('userToken');
           res.clearCookie('adminToken');
           res.redirect('/')
       }
    })
 }


