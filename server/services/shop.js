const axios= require('axios');
const Userdb = require('../model/model');
const jwt = require('jsonwebtoken');
const Categorydb =require('../model/categorymodel');
const Addressdb =require('../model/addressmodel');
const Productdb =require('../model/productmodel');
const Cartdb =require('../model/cartmodel');

exports.prodetail = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Productdb.findById(productId);
        const categories = await Categorydb.find({});
        const products = await Productdb.find({});
        const relatedProducts = await Productdb.find({ category: product.category, _id: { $ne: productId } }).limit(3);

        if (req.cookies.userToken) {
            const email = req.session.email;
            const user = await Userdb.findOne({ email: email });
            const cart = await Cartdb.findOne({ user: user._id });
            let productInCart = null;
            if (cart) {
                productInCart = cart.items.find(item => item.productId.toString() === productId);
            }
            res.render('productdetails', { userToken: req.cookies.userToken, product: product, categories: categories, products: products, relatedProducts: relatedProducts, user: user, productInCart: productInCart });
        } else if (req.cookies.adminToken) {
            res.redirect('/admin/manage');
        } else {
            res.render('productdetails', { userToken: undefined, product: product, categories: categories, products: products, relatedProducts: relatedProducts, user: undefined });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

exports.men=async(req, res) => {
    try {
        const menCategory = await Categorydb.findOne({ category: 'Men' });

        if (!menCategory) {
            return res.status(404).send('Category not found');
        }

        // Find products with category ID matching "Men" category
        const menProducts = await Productdb.find({ category: menCategory._id });
        if(req.cookies.userToken){
            const email= req.session.email;
            const user = await Userdb.findOne({ email: email });
            res.render('eachcategory', { relatedProducts: menProducts,userToken: req.cookies.userToken,catname:'Men' ,user: user}); 
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
        const WomenCategory = await Categorydb.findOne({ category: 'Women' });
        if (!WomenCategory) {
            return res.status(404).send('Category not found');
        }

        // Find products with category ID matching "Men" category
        const WomenProducts = await Productdb.find({ category: WomenCategory._id });
        if(req.cookies.userToken){
            const email= req.session.email;
            const user = await Userdb.findOne({ email: email });
            res.render('eachcategory', { relatedProducts: WomenProducts,userToken: req.cookies.userToken,catname:'Women',user:user  }); 
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
            const email= req.session.email;
            const user = await Userdb.findOne({ email: email });
            res.render('eachcategory', { relatedProducts, userToken: req.cookies.userToken,catname:'Kid' ,user: user });
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
exports.account=async (req,res)=>{
    if (req.cookies.userToken) {
    const user = await Userdb.findOne({ email: req.session.email });
    if (!user) {
        // Handle case where user is not found
        console.error("User not found");
        // Render an error page or redirect to a relevant route
        return res.status(404).render('error', { message: 'User not found' });
    }
    res.render("profile",{userToken: req.cookies.userToken, user: user});
}
else if (req.cookies.adminToken) {
    res.redirect('/admin/manage');
}
else{
    res.redirect('/home');
}
};
exports.useraddress=async (req,res)=>{
    if (req.cookies.userToken) {
    const user = await Userdb.findOne({ email: req.session.email });
    const userId= user._id;
    const addresses= await Addressdb.find({user: userId});
    if (!user) {
        // Handle case where user is not found
        console.error("User not found");
        // Render an error page or redirect to a relevant route
        return res.status(404).render('error', { message: 'User not found' });
    }
    res.render("address",{userToken: req.cookies.userToken, user: user,addresses:addresses});
}
else if (req.cookies.adminToken) {
    res.redirect('/admin/manage');
}
else{
    res.redirect('/home');
}
};
exports.addaddress=async (req,res)=>{
    if (req.cookies.userToken) {
    const user = await Userdb.findOne({ email: req.session.email });
    if (!user) {
        // Handle case where user is not found
        console.error("User not found");
        // Render an error page or redirect to a relevant route
        return res.status(404).render('error', { message: 'User not found' });
    }
    res.render("addaddress",{userToken: req.cookies.userToken, user: user});
}
else if (req.cookies.adminToken) {
    res.redirect('/admin/manage');
}
else{
    res.redirect('/home');
}
};
exports.editaddress=async (req,res)=>{
    if (req.cookies.userToken) {
    const user = await Userdb.findOne({ email: req.session.email });
    if (!user) {
        // Handle case where user is not found
        console.error("User not found");
        // Render an error page or redirect to a relevant route
        return res.status(404).render('error', { message: 'User not found' });
    }
    res.render("editaddress",{userToken: req.cookies.userToken, user: user});
}
else if (req.cookies.adminToken) {
    res.redirect('/admin/manage');
}
else{
    res.redirect('/home');
}
};
exports.cart = async (req, res) => {
    try {
        const user = await Userdb.findOne({ email: req.session.email });
        // Always set the quantity to 1 when adding a new item
        const parsedQuantity = 1;

        const cart = await Cartdb.findOne({ user: user._id }).populate('items.productId');

        res.render('cart', { userToken: req.cookies.userToken, cart: cart, user: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}