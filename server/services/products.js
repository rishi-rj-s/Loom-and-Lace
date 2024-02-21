const axios= require('axios');
const Productdb = require('../model/productmodel');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const multer= require('multer');
const Categorydb =require('../model/categorymodel');

exports.product = async (req, res) => {
    if (req.cookies.adminToken) {
        try {
            // Fetch products from the API
            const productResponse = await axios.get('http://localhost:3000/api/products');
            const products = productResponse.data;

            // Fetch categories from the database
            const categories = await Categorydb.find({});

            // Render productmanage view and pass categories and products
            res.render('productmanage', { categories, products });
        } catch (error) {
            res.status(500).send({ message: error.message || "Error occurred while fetching products or categories" });
        }
    } else {
        res.redirect('/');
    }
};
exports.addproduct=(req,res)=>{
     if(req.cookies.adminToken){
        Categorydb.find({})
        .then(categories => {
            res.render('addproduct', { categories: categories });
        })
        .catch(error => {
            res.status(500).send({ message: error.message || "Error occurred while fetching categories" });
        });
     }
} 
exports.addcategory=(req,res)=>{
    if(req.cookies.adminToken){
       res.render('addcategory',{message: ""});
    }
  }
  exports.update = async (req, res) => {
    if (req.cookies.adminToken) {
        try {
            const productId = req.query.id; 
            const product = await Productdb.findById(productId); // Fetch product details from the database

            if (!product) {
                return res.status(404).send({ message: `Product with ID ${productId} not found` });
            }

            // Fetch categories from the database
            const categories = await Categorydb.find({});

            // Render the editproduct view and pass the product details and categories as data
            res.render('editproduct', { product, categories });
        } catch (error) {
            res.status(500).send({ message: error.message || "Some error occurred while fetching product details or categories." });
        }
    }
};
exports.list=async (req, res) => {
    try {
        const productId = req.query.id; 
        const product = await Productdb.findById(productId);

        if (!product) {
            return res.status(404).send('User not found');
        }

        product.list = product.list === 'listed' ? 'unlisted' : 'listed';

        await product.save();

        res.redirect('/products'); 
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).send('Error occurred while updating user status');
    }
}
exports.listcat=async (req, res) => {
    try {
        const categoryID = req.query.id; 
        const category = await Categorydb.findById(categoryID);
        if (!category) {
            return res.status(404).send('User not found');
        }

        category.list = category.list === 'listed' ? 'unlisted' : 'listed';
        
        await category.save(); 

        await Productdb.updateMany({ category: categoryID }, { catlist: category.list });

        res.redirect('/admin/categories'); 
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).send('Error occurred while updating user status');
    }
}
