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
route.get('/admin/sales-data', report.salesdata);
route.get('/admin/salesamount-data', report.salesamountdata);
route.get('/admin/monthly-sales-data', report.monthlysalesdata);
route.get('/admin/monthly-salesamount-data', report.monthlysalesamountdata);
route.get('/admin/yearly-sales-data', report.yearlysalesdata);
route.get('/admin/yearly-salesamount-data', report.yearlysalesamountdata);
route.get('/admin/salesreport', report.salesreport);
route.get('/admin/sales-report', report.generatereport);

route.get('/admin/offers',offers.getOffer)
route.get('/updateoffer',offers.getupdateoffer)
route.post('/admin/posteditoffer/:offerId', offers.posteditoffer);
route.get('/admin/addproductoffer', offers.getaddproductoffer);
route.post('/admin/postaddproductoffer',offers.postaddproductoffer);
route.get('/admin/addcategoryoffer',offers.getaddcategoryoffer);
route.post('/admin/postaddcategoryoffer',offers.postaddcategoryoffer);
route.delete('/api/admin/offer/:id',offers.deleteoffer);

module.exports =route