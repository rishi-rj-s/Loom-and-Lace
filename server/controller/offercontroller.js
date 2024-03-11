const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Addressdb =require('../model/addressmodel');
const Cartdb =require('../model/cartmodel');
const Orderdb =require('../model/ordermodel');
const path= require('path');
const Userdb = require('../model/model');
const Coupondb = require('../model/couponmodel');

exports.getOffer= async(req,res)=>{
    if(req.cookies.adminToken){
     
      res.render('adminoffer')
    }else{
         res.redirect('/admin');
    }
}