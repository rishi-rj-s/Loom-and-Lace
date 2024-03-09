const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Addressdb =require('../model/addressmodel');
const Cartdb =require('../model/cartmodel');
const Orderdb =require('../model/ordermodel');
const multer = require('multer');
const sharp = require('sharp');
const path= require('path');
const Userdb = require('../model/model');
const Coupondb = require('../model/couponmodel');
// Import Razorpay SDK
const Razorpay = require('razorpay');

const razorpayKeyId = 'rzp_test_l0JN45NspADoRo';
// Initialize Razorpay with your API key and secret
const razorpay = new Razorpay({
    key_id: 'rzp_test_l0JN45NspADoRo',
    key_secret: 'bRhaVuy5fdvjABsEcAPA71IX'
});

exports.placeorder = async (req, res) => {
    if(req.cookies.userToken){
    try {
        const { addressId, paymentMethod, totalAmount,couponCode } = req.body;
        
        const user = await Userdb.findOne({ email: req.session.email });
        const userId = user._id;
        const address = await Addressdb.findById(addressId);

        let couponUsed;
            let finalTotalAmount = totalAmount;

            // Check if a valid coupon code is provided
            if (couponCode && couponCode !== "selectcoupon") {
                const coupon = await Coupondb.findOne({ couponcode: couponCode });
                if (!coupon) {
                    return res.status(404).json({ message: 'Coupon not found' });
                }
                couponUsed = coupon._id;
                // Subtract coupon discount from the total amount
                finalTotalAmount -= coupon.discount;
            }
        // If payment method is Razorpay
        if (paymentMethod === 'online') {
            const cart = await Cartdb.findOne({ user: userId }).populate('items.productId');
            const razorpayOrder = await razorpay.orders.create({
                amount: totalAmount * 100,
                currency: 'INR',
                payment_capture: 1 
            });
            const items = cart.items.map(item => ({
                productId: item.productId._id, 
                quantity: item.quantity
            }));
            const order = new Orderdb({
                userId: userId,
                items: items,
                orderedDate: new Date(),
                status: 'Order Payment Failed', 
                shippingAddress: address,
                paymentMethod: paymentMethod,
                paymentStatus : 'Failed',
                totalAmount: finalTotalAmount,
                razorpayOrderId: razorpayOrder.id,
                couponused: couponUsed
            });

            await order.save();

            return res.redirect(`/razorpay/checkout/${order._id}`);
        } else if (paymentMethod === 'cod') {               
                const user = await Userdb.findOne({ email: req.session.email });
                const userId = user._id;
                
                const address = await Addressdb.findById(addressId);
                const cart = await Cartdb.findOne({ user: userId }).populate('items.productId');
                if(cart){
                if (!cart || !cart.items || cart.items.length === 0) {
                    res.redirect('/cart');
                }
                const items = cart.items.map(item => ({
                    productId: item.productId._id, 
                    quantity: item.quantity
                }));
        
                const order = new Orderdb({
                    userId: userId,
                    items: items,
                    orderedDate: new Date(),
                    status: 'Order Placed',
                    shippingAddress: address,
                    paymentMethod: paymentMethod,
                    totalAmount: finalTotalAmount,
                    couponused: couponUsed
                });
        
                await order.save();

                await Cartdb.deleteOne({ user: userId });

                for (const item of cart.items) {
                    console.log(item.productId);
                    await Productdb.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
                }
                res.render('ordersuccess',{userToken: req.cookies.userToken,user: user})
            
        } else {

            return res.redirect('/cart');
        }
        }
        else if(paymentMethod === 'wallet'){
            const user = await Userdb.findOne({ email: req.session.email });
            const userId = user._id;
            
            const address = await Addressdb.findById(addressId);
            const cart = await Cartdb.findOne({ user: userId }).populate('items.productId');
            if (!cart || !cart.items || cart.items.length === 0) {
                return res.redirect('/cart');
            }
        
            const items = cart.items.map(item => ({
                productId: item.productId._id, 
                quantity: item.quantity
            }));
        
            const order = new Orderdb({
                userId: userId,
                items: items,
                orderedDate: new Date(),
                status: 'Order Placed',
                shippingAddress: address,
                paymentMethod: paymentMethod,
                totalAmount: finalTotalAmount,
                paymentStatus : 'Paid',
                couponused: couponUsed
            });
        
            await order.save();
        
            await Cartdb.deleteOne({ user: userId });
        
            // Subtract totalAmount from walletAmount
            user.walletAmount -= totalAmount;
            await user.save();
        
            for (const item of cart.items) {
                console.log(item.productId);
                await Productdb.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }
        
            res.render('ordersuccess', { userToken: req.cookies.userToken, user: user });
        } else {
            return res.redirect('/cart');
        }        
    } catch (error) {
        // Handle errors
        console.error(error);
        return res.redirect('/cart');
    }
}
};

exports.userorders=async (req, res) => {
    if(req.cookies.userToken){
    try {
      const user = await Userdb.findOne({ email: req.session.email });
      const userId= user._id;
        const orders = await Orderdb.find({ userId: user._id}).populate('items.productId').sort({_id:-1});
        const dates = orders.map(order => order.orderedDate.toDateString());
        // Render the userorders.ejs template with orders data
        res.render('userorders', { userToken: req.cookies.userToken,user: user, orders, dates });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        // Render an error page or redirect to another route
        res.status(500).send('Internal Server Error');
    }
}
};
exports.userorderdetails=async (req, res) => {
    if(req.cookies.userToken){
    try {
        const orderId = req.params.orderId;
        const user = await Userdb.findOne({ email: req.session.email });

        const order = await Orderdb.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('userorderdetails', {userToken: req.cookies.userToken,user: user, order: order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Internal Server Error');
    }
  }
}
 exports.userordercancel= async (req, res) => {
    if(req.cookies.userToken){
    try {
        const order = await Orderdb.findById(req.params.orderId);
        const user = await Userdb.findOne({ email: req.session.email });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
       }
       if(order.paymentMethod=='online' || order.paymentMethod=='wallet'){
        user.walletAmount+= order.totalAmount;
       }
     order.status = 'Cancelled';
        await order.save();
        await user.save();

        res.redirect('/userorders')
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
};
exports.userorderreturn=async (req, res) => {
    try {
        const order = await Orderdb.findById(req.params.orderId);
        const user = await Userdb.findOne({ email: req.session.email });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
       }
       order.status = 'Return Requested';
        await order.save();
        await user.save();

        res.redirect('/userorders')
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.cancelorderreturn=async (req, res) => {
    try {
        const order = await Orderdb.findById(req.params.orderId);
        const user = await Userdb.findOne({ email: req.session.email });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
       }
        order.status = 'Delivered';
        await order.save();
        await user.save();

        res.redirect('/userorders')
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.razor=async (req, res) => {
    try {
        const user = await Userdb.findOne({ email: req.session.email });
        const orderId = req.params.orderId;
        // Fetch the order details from the database based on the orderId
        const order = await Orderdb.findById(orderId);
        if (!order) {
            return res.redirect('/cart'); 
        }
        res.render('razorpay_checkout', { order: order,razorpayKeyId: razorpayKeyId,user:user,userToken: req.cookies.userToken });
    } catch (error) {
        console.error(error);
        res.redirect('/cart');
    }
  }

exports.razorsuccess=async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Orderdb.findById(orderId);
        console.log(order)
        const user = await Userdb.findOne({ email: req.session.email });
        const cart = await Cartdb.findOne({ user: user._id }).populate('items.productId');

        if (!order) {
            return res.redirect('/error');
        }
        order.status = 'Order Placed';
        order.paymentStatus = 'Paid';
        await order.save();
        await Cartdb.deleteOne({ user: user._id });

        for (const item of cart.items) {
            console.log(item.productId);
            await Productdb.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        res.render('ordersuccess', {userToken: req.cookies.userToken,user: user });
    } catch (error) {
        console.error(error);
        return res.redirect('/error');
    }
};

