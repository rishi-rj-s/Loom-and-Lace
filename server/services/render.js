const axios= require('axios');
const Userdb = require('../model/model');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
require('../middleware/auth');
const passport = require('passport');
const Orderdb = require('../model/ordermodel');

exports.home=async(req,res)=>{
    try {
        // Fetch products and categories from the database
        const products = await Productdb.find();
        const categories = await Categorydb.find();
         if (req.cookies.userToken) {
            try {
                const email= req.session.email;
                const user = await Userdb.findOne({ email: email });
                const userToken = req.cookies.userToken;
         
                res.render('index', { userToken: userToken, products: products, categories: categories,user: user });
            } catch (error) {
                // If token verification fails, redirect to the index page
                console.error(error);
                res.render('index', { title: "LOOM",userToken: undefined, products: products, categories: categories });
            }
        }else {
            res.render('index', { userToken: undefined, products: products, categories: categories });
        }
    } catch (error) {
        console.error(error);
        res.render('404'); 
    }
}
exports.loginpage=(req,res)=>{
    if(req.cookies.userToken)
    {
        res.redirect("/");
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
        if(req.cookies.userToken){
             res.redirect('/')
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
    if(req.cookies.adminToken) {
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
exports.manage = async (req, res) => {
    try {
        if (req.cookies.adminToken) {
            const orders = await Orderdb.find({}).populate('items.productId');
            
            // Calculate total sales (total quantity of products sold)
            const totalSales = orders.reduce((acc, order) => {
                order.items.forEach(item => {
                    acc += item.quantity;
                });
                return acc;
            }, 0);

            // Calculate total order amount (total of totalAmount in all orders)
            const totalOrderAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);

            // Calculate total discount
            let totalDiscount = 0;
            orders.forEach(order => {
                order.items.forEach(item => {
                    // Calculate product price after discount
                    const productPrice = item.productId.price * item.quantity;
                    const discountedPrice = productPrice * (1 - (item.productId.discount / 100));
                    const discountAmount = productPrice - discountedPrice;
                    totalDiscount += discountAmount;
                });
            });

            // Calculate top 10 products bought
            const productFrequency = {};
            orders.forEach(order => {
                order.items.forEach(item => {
                    const productId = item.productId._id.toString();
                    if (productFrequency[productId]) {
                        productFrequency[productId]++;
                    } else {
                        productFrequency[productId] = 1;
                    }
                });
            });
            const topProductsIds = Object.keys(productFrequency)
                .sort((a, b) => productFrequency[b] - productFrequency[a])
                .slice(0, 10);

            const topProducts = await Promise.all(topProductsIds.map(async productId => {
                const product = await Productdb.findById(productId); 
                return {
                    id: productId,
                    name: product.product_name,
                    images: product.images,
                    frequency: productFrequency[productId]
                };
            }));

            // Calculate top 10 categories
            const categoryFrequency = {};
            orders.forEach(order => {
                order.items.forEach(item => {
                    const categoryId = item.productId.category.toString();
                    if (categoryFrequency[categoryId]) {
                        categoryFrequency[categoryId]++;
                    } else {
                        categoryFrequency[categoryId] = 1;
                    }
                });
            });
            const topCategoriesIds = Object.keys(categoryFrequency)
                .sort((a, b) => categoryFrequency[b] - categoryFrequency[a])
                .slice(0, 10);

            const topCategories = await Promise.all(topCategoriesIds.map(async categoryId => {
                const category = await Categorydb.findById(categoryId); 
                return {
                    id: categoryId,
                    name: category.category,
                    frequency: categoryFrequency[categoryId]
                };
            }));

            // Calculate top 10 brands
            const brandFrequency = {};
            orders.forEach(order => {
                order.items.forEach(item => {
                    const brandName = item.productId.brand;
                    if (brandFrequency[brandName]) {
                        brandFrequency[brandName]++;
                    } else {
                        brandFrequency[brandName] = 1;
                    }
                });
            });
            const topBrands = Object.keys(brandFrequency)
                .sort((a, b) => brandFrequency[b] - brandFrequency[a])
                .slice(0, 10)
                .map(brandName => ({ name: brandName, frequency: brandFrequency[brandName] }));

            res.render('admindashboard', { 
                orders: orders,
                totalSales: totalSales,
                totalOrderAmount: totalOrderAmount,
                totalDiscount: totalDiscount,
                topProducts: topProducts,
                topCategories: topCategories,
                topBrands: topBrands
            });
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        return  res.render('404');
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
        res.render('404');
    }
}

exports.logout=(req,res)=>{
           res.clearCookie('adminToken');
           res.redirect('/admin')
    }
 exports.userlogout=(req,res)=>{
    req.session.destroy(function(err){
       if(err){
          console.log(err);
          res.send("Error")
       }else{
           res.clearCookie('userToken');
           res.redirect('/')
       }
    })
 }


