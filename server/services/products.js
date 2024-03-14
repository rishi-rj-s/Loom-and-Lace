const axios= require('axios');
const Productdb = require('../model/productmodel');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const multer= require('multer');
const Categorydb =require('../model/categorymodel');
const Orderdb =require('../model/ordermodel');
const Userdb =require('../model/model');
const Wallet= require('../model/wallethistory')


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
            res.render('404');
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
                return  res.render('404');
            }

            // Fetch categories from the database
            const categories = await Categorydb.find({});

            // Render the editproduct view and pass the product details and categories as data
            res.render('editproduct', { product, categories });
        } catch (error) {
            res.render('404');
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
        res.render('404');
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
        res.render('404');
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
            res.render('404');
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
        console.log(newStatus)
        const newPaymentStatus = req.body.paymentStatus;

        const updatedOrder = await Orderdb.findByIdAndUpdate(orderId, { status: newStatus, paymentStatus: newPaymentStatus }, { new: true });
        const user = await Userdb.findById(updatedOrder.userId);

        const order = await Orderdb.findById(orderId);
        console.log(order);
        if (order.status === "Return Accepted") {
            console.log("Refund Amount:", order.totalAmount); 
            user.walletAmount += order.totalAmount;
            for (const item of order.items) {
                const product = await Productdb.findById(item.productId);
            
                if (product) {
                    product.stock += item.quantity;  
                    await product.save()
                } else {
                    console.log(`Product with ID ${item.productId} not found`);
                }
            }
            
            const creditTransaction = new Wallet({
                userId: user._id,
                transactionType: 'Credit',
                amount: order.totalAmount,
                order: order.orderId, 
                state: "Returned",
                timestamp: new Date()
            });
            await creditTransaction.save();
            console.log("Updated Wallet Amount:", user.walletAmount); // Check the updated wallet amount
            await user.save(); 
        }
        if (order.status === "Cancelled" && order.paymentStatus==="Paid") {
            user.walletAmount += order.totalAmount;
            const creditTransaction = new Wallet({
                userId: user._id,
                transactionType: 'Credit',
                amount: order.totalAmount,
                order: order.orderId, 
                state: "Cancelled",
                timestamp: new Date()
            });
            await creditTransaction.save();
            console.log("Updated Wallet Amount:", user.walletAmount); // Check the updated wallet amount
            await user.save(); 
        }
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.render('404');
    }
}
