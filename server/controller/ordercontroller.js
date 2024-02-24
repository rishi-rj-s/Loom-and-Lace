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

exports.addtocart = async (req, res) => {
    try {
        const { productId, userId } = req.body;
       
        const parsedQuantity = 1;
 
        let cart = await Cartdb.findOne({ user: userId });
 
        if (!cart) {
            cart = new Cartdb({
                user: userId,
                items: []
            });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (existingItemIndex !== -1) {
            cart.items[existingItemIndex].quantity += parsedQuantity;
        } else {
            cart.items.push({ productId, quantity: parsedQuantity });
        }
        await cart.save();

        // Fetch the updated cart with product details
        const cartItems = await Cartdb.findOne({ user: userId }).populate('items.productId');
        
        // Calculate total amount and total discount
        let totalAmount = 0;
        let totalDiscount = 0;
        cartItems.items.forEach(item => {
            const { productId, quantity } = item;
            const totalPrice = productId.price * quantity;
            const totalDiscountAmount = productId.total_price * quantity;

            totalAmount += totalPrice;
            totalDiscount += totalDiscountAmount;
        });
        
        // Update the cart with total amount and total discount
        cartItems.totalAmount = totalAmount;
        cartItems.totalDiscount = totalDiscount;
        await cartItems.save();
        
        // Render the cart page with the updated cartItems
         res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deletecart = async (req, res) => {
            const itemId = req.params.id;
            const user = await Userdb.findOne({ email: req.session.email });
            const userId= user._id;
            const updatedCart = await Cartdb.findOneAndUpdate(
                { user: userId },
                { $pull: { items: { _id: itemId } } },
                { new: true }
            ).then(data =>{
                if(!data){
                    res.status(404).send({message:  `Cannot delete with id ${id}.Id may be wrong`})
                }else{
                    res.send({
                        message: "Cart was was deleted successfully!!!"
                    })
                }
            })
            .catch(err=>{
                res.status(500).send({ message: "Could not delete cart item with id "+id});
            });    
};
exports.addquantitycart=async (req, res) => {
        const itemId = req.params.id;
        const newQuantity = parseInt(req.body.quantity);

        const user = await Userdb.findOne({ email: req.session.email });
        const userId= user._id;
        const updatedCart = await Cartdb.findOneAndUpdate(
            { user: userId, "items._id": itemId }, // Filter by user ID and item ID
            { $set: { "items.$.quantity": newQuantity } }, // Update the quantity of the matched item
            { new: true }
        ).then(data =>{
            if(!data){
                res.status(404).send({message:  `Cannot delete with id ${id}.Id may be wrong`})
            }else{
                res.send({
                    message: "Cart quantity added succesfully"
                })
            }
        })
        .catch(err=>{
            res.status(500).send({ message: "Could not delete cart item with id "+id});
        }); 
}
exports.cart = async (req, res) => {
    if(req.cookies.userToken){
    try {
        const user = await Userdb.findOne({ email: req.session.email });

        const cart = await Cartdb.findOne({ user: user._id }).populate('items.productId');
        // Calculate total amount and total discount
        let totalAmount = 0;
        let totalDiscount = 0;
        cart.items.forEach(item => {
            const { productId, quantity } = item;
            const totalPrice = productId.price * quantity;
            const totalDiscountAmount = productId.total_price * quantity;

            totalAmount += totalPrice;
            totalDiscount += totalDiscountAmount;
        });
        
        // Update the cart with total amount and total discount
        cart.totalAmount = totalAmount;
        cart.totalDiscount = totalDiscount;
        await cart.save();

        res.render('cart', { userToken: req.cookies.userToken, cart: cart, user: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
}
exports.checkout = async (req, res) => {
    if(req.cookies.userToken){
        const user = await Userdb.findOne({ email: req.session.email });
        const userId= user._id;
        const cart = await Cartdb.findOne({ user: userId }).populate('items.productId')
        const addresses= await Addressdb.find({user: userId});
        res.render('checkout',{userToken: req.cookies.userToken,user: user ,addresses: addresses,cart: cart});
    }
}   
exports.placeorder = async (req, res) => {
    try {
        const { addressId, paymentMethod, totalAmount } = req.body;

        const user = await Userdb.findOne({ email: req.session.email });
        const userId= user._id;
        // Fetch address details from the database using the addressId
        const address = await Addressdb.findById(addressId);

        // Fetch cart items for the user
        const cartItems = await Cartdb.find({ user: userId }).populate('items.productId');

        // Extract item details from cartItems
        const items = cartItems.map(cartItem => ({
            productId: cartItem.productId,
            quantity: cartItem.quantity
        }));

        // Create a new order
        const order = new Orderdb({
            userId: userId,
            items: items,
            orderedDate: new Date(),
            status: 'Order Placed',
            shippingAddress: address,
            paymentMethod: paymentMethod,
            totalAmount: totalAmount
        });
        console.log(items.quantity);
        // Save the order to the database
        await order.save();

        // Delete purchased items from the cart
        await Cartdb.deleteMany({ user: userId });

        // Update stock for each purchased item
        for (const item of items) {
            await Productdb.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // Send a success response
        res.status(200).json({ message: 'Order placed successfully' });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};