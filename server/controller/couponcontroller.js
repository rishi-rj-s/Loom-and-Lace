const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Addressdb =require('../model/addressmodel');
const Cartdb =require('../model/cartmodel');
const Orderdb =require('../model/ordermodel');
const Coupondb =require('../model/couponmodel');
const multer = require('multer');
const sharp = require('sharp');
const path= require('path');
const Userdb = require('../model/model');

exports.getadminCoupons=async(req,res)=>{
    const coupons= await Coupondb.find();
    res.render('coupons',{coupons})
}
exports.getaddcoupon=async(req,res)=>{
    res.render('addcoupon')
}