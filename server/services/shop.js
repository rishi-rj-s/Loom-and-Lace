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
exports.men=async(req, res) => {
    try {
        // Find category ID for "Men" category
        const menCategory = await Categorydb.findOne({ category: 'Men' });

        if (!menCategory) {
            return res.status(404).send('Category not found');
        }

        // Find products with category ID matching "Men" category
        const menProducts = await Productdb.find({ category: menCategory._id });
        if(req.cookies.userToken){
            res.render('eachcategory', { relatedProducts: menProducts,userToken: req.cookies.userToken,catname:'Men' }); 
        }
        else if(req.cookies.adminToken){
            res.redirect('/admin/manage');
        }
        // Render product showing page and pass products data
        res.render('eachcategory', { relatedProducts: menProducts,userToken: undefined ,catname:'Men' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
exports.women=async(req, res) => {
    try {
        // Find category ID for "Men" category
        const WomenCategory = await Categorydb.findOne({ category: 'Women' });

        if (!WomenCategory) {
            return res.status(404).send('Category not found');
        }

        // Find products with category ID matching "Men" category
        const WomenProducts = await Productdb.find({ category: WomenCategory._id });
        if(req.cookies.userToken){
            res.render('eachcategory', { relatedProducts: WomenProducts,userToken: req.cookies.userToken,catname:'Women'  }); 
        }
        else if(req.cookies.adminToken){
            res.redirect('/admin/manage');
        }
        // Render product showing page and pass products data
        res.render('eachcategory', { relatedProducts: WomenProducts,userToken: undefined,catname:'Women'  });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
exports.kids = async (req, res) => {
    try {
        const categories = await Categorydb.find({ category: { $in: ['Boys', 'Girls'] } });

        if (!categories || categories.length !== 2) {
            return res.status(404).send('Categories not found');
        }
        const boysCategory = categories.find(cat => cat.category === 'Boys');
        const girlsCategory = categories.find(cat => cat.category === 'Girls');

        const boysProducts = await Productdb.find({ category: boysCategory._id });
        const girlsProducts = await Productdb.find({ category: girlsCategory._id });

        // Combine boys' and girls' products into one array
        const relatedProducts = [...boysProducts, ...girlsProducts];

        // Render product showing page and pass products data
        if (req.cookies.userToken) {
            res.render('eachcategory', { relatedProducts, userToken: req.cookies.userToken,catname:'Kid'  });
        } else if (req.cookies.adminToken) {
            res.redirect('/admin/manage');
        } else {
            res.render('eachcategory', { relatedProducts, userToken: undefined,catname:'Kid'  });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

