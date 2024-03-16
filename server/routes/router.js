const express= require('express')
const jwt = require('jsonwebtoken');
const route=express.Router()
const multer= require('multer');
const path =require('path');

const services=require('../services/render')
const products=require('../services/products')
const shop=require('../services/shop')
const forgot=require('../services/forgotpassword')
const controller = require('../controller/controller');
const productcontroller = require('../controller/productcontroller');
const categorycontroller = require('../controller/categorycontroller');
const ordercontroller = require('../controller/ordercontroller');
const cartcontroller = require('../controller/cartcontroller');
const invoice = require('../controller/invoice');
const report = require('../controller/reportcontroller');
const coupons = require('../controller/couponcontroller');
const offers = require('../controller/offercontroller');
const auths= require('../middleware/authentication');
const Userdb=require('../model/model')

//home config side
route.get('/home',auths.isUser,services.home);
route.get('/userlogout',services.userlogout);
route.get('/forgotpassword',forgot.getforgotpage);
route.post('/loginforgotpassword',forgot.loginforgotpassword);
route.post('/ver-forgototp',forgot.verforgototp);
route.post('/setNewLoginPassword',forgot.setNewLoginPassword);

//user side
route.get('/loginpage',services.loginpage);
route.post('/login',services.login);
route.post('/verify-otp',services.verify);
route.get('/signup',services.signup);
route.get('/forgot-otp',auths.isUser,forgot.forgototp);
route.post('/ver-otp',auths.isUser,forgot.verotp);
route.post('/setNewPassword',auths.isUser,forgot.setNewPassword);
// Add a new route for downloading PDF
route.get('/orders/:orderId/invoice',invoice.generateOrderInvoice);

// user home side
route.get('/prodetail',shop.prodetail);
route.get('/menrelated',shop.men);
route.get('/womenrelated',shop.women);
route.get('/kidsrelated',shop.kids);
route.get('/useraccount',auths.isUser,shop.account);
route.get('/useraddress',auths.isUser,shop.useraddress);
route.get('/addaddress',auths.isUser,shop.addaddress);

//home api
route.get('/shopfilter',controller.shopfilter); 
route.post('/sortAndFilterProducts/:sortBy', controller.getSortedProducts);
route.post('/wishlist/:productId',auths.isUser, shop.wishlist);
route.get('/search',shop.search);
route.get('/searchproduct',shop.searched);
route.get('/paymentpolicies',invoice.policy);
route.get('/getUserInfo', shop.getUser);



//orders and cart
route.get('/cart',auths.isUser,cartcontroller.cart);
route.post('/addtocart/:id',auths.isUser,cartcontroller.addtocart);
route.delete('/api/cart/:id',auths.isUser,cartcontroller.deletecart);
route.put('/api/cart/:id',auths.isUser,cartcontroller.addquantitycart);
route.get('/checkout',auths.isUser,cartcontroller.checkout);
route.post('/placeorder',auths.isUser,ordercontroller.placeorder);
route.get('/userorders', auths.isUser,ordercontroller.userorders);
route.get('/orderDetails/:orderId',auths.isUser, ordercontroller.userorderdetails);
route.get('/cancelOrder/:orderId', auths.isUser,ordercontroller.userordercancel);
route.get('/returnOrder/:orderId', auths.isUser,ordercontroller.userorderreturn);
route.get('/cancelReturn/:orderId', auths.isUser,ordercontroller.cancelorderreturn);
route.post('/applyCoupon', auths.isUser,coupons.applyCoupon)

//profilepart
route.post('/update-user/:id',controller.updateuser);
route.post('/api/addaddress/:id',auths.isUser,controller.postaddaddress);
route.delete('/api/useraddress/:id',auths.isUser,controller.deleteaddress);
route.get('/update-address',auths.isUser,controller.updateaddress)
route.post('/api/editaddress/:id',auths.isUser,controller.posteditaddress);
route.get('/wishlisted', auths.isUser,shop.wishlisted);
route.delete('/wishlist/:itemId',auths.isUser, shop.deletewishlist)
route.get('/wallethistory',auths.isUser,ordercontroller.wallethistory)

//api realted to db
route.post('/api/signup',controller.signup);
route.get('/resend-otp', controller.resendotp);

route.post('/api/users',controller.create);
route.get('/api/users',controller.find);

//razorpay
route.get('/razorpay/checkout/:orderId' ,auths.isUser, ordercontroller.razor);
route.post('/razorpay/pay/:orderId' ,auths.isUser, ordercontroller.razorsuccess);


module.exports =route