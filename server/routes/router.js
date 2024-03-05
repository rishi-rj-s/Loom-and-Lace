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
const auths= require('../middleware/authentication');
const Orderdb = require('../model/ordermodel');
const Productdb = require('../model/productmodel');
const Categorydb = require('../model/categorymodel');
const Userdb = require('../model/model');
const Cartdb = require('../model/cartmodel');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({ storage: storage });
//home config side
route.get('/home',auths.isUser,services.home);
// Add a new route for downloading PDF
route.get('/orders/:orderId/invoice',invoice.generateOrderInvoice);
//user side
route.get('/loginpage',services.loginpage);
route.post('/login',services.login);
route.post('/verify-otp',services.verify);
route.get('/signup',services.signup);
route.get('/forgot-otp',auths.isUser,forgot.forgototp);
route.post('/ver-otp',auths.isUser,forgot.verotp);
route.post('/setNewPassword',auths.isUser,forgot.setNewPassword);


// user home side
route.get('/prodetail',shop.prodetail);
route.get('/menrelated',shop.men);
route.get('/womenrelated',shop.women);
route.get('/kidsrelated',shop.kids);
route.get('/useraccount',auths.isUser,shop.account);
route.get('/useraddress',auths.isUser,shop.useraddress);
route.get('/addaddress',auths.isUser,shop.addaddress);

//home api
route.post('/update-user/:id',controller.updateuser);
route.post('/api/addaddress/:id',auths.isUser,controller.postaddaddress);
route.delete('/api/useraddress/:id',auths.isUser,controller.deleteaddress);
route.get('/update-address',auths.isUser,controller.updateaddress)
route.post('/api/editaddress/:id',auths.isUser,controller.posteditaddress);
route.get('/shopfilter',controller.shopfilter); 
route.post('/sortAndFilterProducts/:sortBy', controller.getSortedProducts);
route.post('/wishlist/:productId',auths.isUser, shop.wishlist);
route.get('/wishlisted', auths.isUser,shop.wishlisted);
route.delete('/wishlist/:itemId',auths.isUser, shop.deletewishlist)
route.get('/search-suggestions',shop.search);
route.get('/searchproduct',shop.searched);

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

//admin side
route.get('/admin',services.admin)
route.post('/adminlogin',services.adminlogin)
route.get('/logout',services.logout)
route.get('/admin/users',services.users)
route.get('/block-user',services.block)
route.get('/admin/orders',products.orders)
route.get('/admin/orderDetails/:orderId',products.getAdminorderdetails)
route.post('/admin/updateOrderStatus/:orderId',products.updateorderstatus)
route.get('/admin/coupons',coupons.getadminCoupons)
route.get('/admin/addcoupon',coupons.getaddcoupon)
route.post('/api/createcoupon',coupons.createcoupon)
route.delete('/api/admin/coupon/:id',coupons.delete);
route.get('/update-coupon',coupons.getupdatecoupon)
route.post('/api/updatecoupon/:id',coupons.postupdatecoupon)

//admin dash
route.get('/admin/manage',services.manage)
route.get('/admin/monthly-sales-data', report.monthlysales);
route.get('/admin/sales-data', report.weeklysales);
route.get('/admin/salesreport', report.salesreport);
route.get('/admin/sales-report', report.generatereport);

//products side
route.get('/products',products.product)
route.get('/admin/addproduct',products.addproduct)
route.get('/update-product',products.update)
route.get('/admin/addcategory',products.addcategory)
route.get('/list-product',products.list)

//api realted to db
route.post('/api/signup',controller.signup);
route.post('/api/users',controller.create);
route.get('/api/users',controller.find);

//products api
route.get('/api/products',productcontroller.find);
route.post('/api/createproduct',upload.array('images',4 ),productcontroller.createproduct);
route.post('/api/admin/editproduct/:id',upload.array('images',4 ),productcontroller.update);
route.delete('/api/admin/products/:id',productcontroller.delete);
route.delete('/api/admin/deleteimage/:productId/:index',productcontroller.imagedelete);

//category api
route.post('/api/createcategory',categorycontroller.catcreate);
route.get('/admin/categories',categorycontroller.getCategories);
route.get('/update-category',categorycontroller.getupdateCategory);
route.post('/api/admin/editcategory/:id',categorycontroller.postupdateCategory);
route.delete('/api/admin/categories/:id',categorycontroller.delete);
route.get('/list-cat',products.listcat);

//razorpay
route.get('/razorpay/checkout/:orderId' ,auths.isUser, ordercontroller.razor);
route.post('/razorpay/pay/:orderId' ,auths.isUser, ordercontroller.razorsuccess);


module.exports =route