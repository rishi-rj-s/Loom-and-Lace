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

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
  });
  
  const upload = multer({ storage: storage });

//products side
route.get('/products',products.product)
route.get('/admin/addproduct',products.addproduct)
route.get('/update-product',products.update)
route.get('/admin/addcategory',products.addcategory)
route.get('/list-product',products.list)

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

module.exports =route