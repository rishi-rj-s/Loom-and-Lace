const axios= require('axios');
const Userdb = require('../model/model');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');

exports.prodetail=async(req,res)=>{
        const productId = req.query.id; 
        const product = await Productdb.findById(productId);
        const categories=await Categorydb.find({});
        const products=await Productdb.find({});
        const relatedProducts= await Productdb.find({category: product.category,_id:{$ne: productId}}).limit(3);
    if(req.cookies.userToken){
        
    res.render('productdetails',{userToken: req.cookies.userToken,product: product, categories: categories,products: products,relatedProducts: relatedProducts})
    }
    else if(req.cookies.adminToken){
        res.redirect('/admin/manage');
    }
    else{
        res.render('productdetails',{userToken: undefined,product: product, categories: categories,products: products,relatedProducts: relatedProducts}) 
    }
}