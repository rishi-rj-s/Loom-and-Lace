const axios= require('axios');
const Productdb = require('../model/productmodel');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const multer= require('multer');
const Categorydb =require('../model/categorymodel');
const Orderdb =require('../model/ordermodel');
const Userdb =require('../model/model');


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
exports.orders = async (req, res) => {
    if (req.cookies.adminToken) {
        try {
            const orders = await Orderdb.find({}).populate({
                path: 'userId',
                model: Userdb
            }).populate({
                path: 'items.productId',
                model: Productdb
            }).sort({ _id: -1 }).exec();

            res.render('adminorder', { orders: orders });
        } catch (error) {
            res.status(500).send({ message: error.message || "Error occurred while fetching products or categories" });
        }
    } else {
        res.redirect('/');
    }   
};
exports.getAdminorderdetails=async (req, res) => {
    const orderId = req.params.orderId;
    try {
        // Find the order by its ID
        const order = await Orderdb.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).render('errorPage', { errorMessage: 'Order not found' });
        }
        res.render('orderdetails', { order: order });
    } catch (error) {

        console.error('Error fetching order details:', error);
         res.redirect('/admin/orders');
    }
};
exports.updateorderstatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.status;
        const newPaymentStatus = req.body.paymentStatus;
        const user = await Userdb.findOne({ email: req.session.email });

        const updatedOrder = await Orderdb.findByIdAndUpdate(orderId, { status: newStatus, paymentStatus: newPaymentStatus }, { new: true });

        const order = await Orderdb.findById(orderId);
        console.log(order);
        if (order.status === "Return Accepted") {
            console.log("Refund Amount:", order.totalAmount); // Check the refund amount
            user.walletAmount += order.totalAmount;
            console.log("Updated Wallet Amount:", user.walletAmount); // Check the updated wallet amount
            await user.save(); 
        }

       

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
}
