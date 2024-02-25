const express= require('express')
const jwt = require('jsonwebtoken');
const route=express.Router()
const multer= require('multer');
const path =require('path');

const services=require('../services/render')
const products=require('../services/products')
const shop=require('../services/shop')
const controller = require('../controller/controller');
const productcontroller = require('../controller/productcontroller');
const categorycontroller = require('../controller/categorycontroller');
const ordercontroller = require('../controller/ordercontroller');
const auths= require('../middleware/authentication');
const Orderdb = require('../model/ordermodel');

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
route.get('/home',services.home);
//user side
route.get('/loginpage',services.loginpage);
route.post('/login',services.login);
route.post('/verify-otp',services.verify);
route.get('/signup',services.signup);


// user home side
route.get('/prodetail',shop.prodetail);
route.get('/menrelated',shop.men);
route.get('/womenrelated',shop.women);
route.get('/kidsrelated',shop.kids);
route.get('/useraccount',shop.account);
route.get('/useraddress',shop.useraddress);
route.get('/addaddress',shop.addaddress);

//home api
route.post('/update-user/:id',controller.updateuser);
route.post('/api/addaddress/:id',controller.postaddaddress);
route.delete('/api/useraddress/:id',controller.deleteaddress);
route.get('/update-address',controller.updateaddress)
route.post('/api/editaddress/:id',controller.posteditaddress);

//orders and cart
route.get('/cart',ordercontroller.cart);
route.post('/addtocart/:id',ordercontroller.addtocart);
route.delete('/api/cart/:id',ordercontroller.deletecart);
route.put('/api/cart/:id',ordercontroller.addquantitycart);
route.get('/checkout',ordercontroller.checkout);
route.post('/placeorder',ordercontroller.placeorder);

//admin side
route.get('/admin',services.admin)
route.post('/adminlogin',services.adminlogin)
route.get('/admin/manage',services.manage)
route.get('/logout',services.logout)
route.get('/admin/users',services.users)
route.get('/block-user',services.block)
route.get('/admin/orders',products.orders)
route.get('/admin/orderDetails/:orderId',products.getAdminorderdetails)
route.post('/admin/updateOrderStatus/:orderId',products.updateorderstatus)

//products side
route.get('/products',products.product)
route.get('/admin/addproduct',products.addproduct)
route.get('/update-product',products.update)
route.get('/admin/addcategory',products.addcategory)
route.get('/update-product',products.update)
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

//category api
route.post('/api/createcategory',categorycontroller.catcreate);
route.get('/admin/categories',categorycontroller.getCategories);
route.get('/update-category',categorycontroller.getupdateCategory);
route.post('/api/admin/editcategory/:id',upload.array('images',4 ),categorycontroller.postupdateCategory);
route.delete('/api/admin/categories/:id',categorycontroller.delete);
route.get('/list-cat',products.listcat);

module.exports =route