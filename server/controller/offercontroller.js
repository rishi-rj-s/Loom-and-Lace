const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Addressdb =require('../model/addressmodel');
const Cartdb =require('../model/cartmodel');
const Orderdb =require('../model/ordermodel');
const path= require('path');
const Userdb = require('../model/model');
const Coupondb = require('../model/couponmodel');
const Offer = require('../model/offermodel');

exports.getOffer = async (req, res) => {
    try {
        if (req.cookies.adminToken) {
         
            const offers = await Offer.find().populate('productId').populate('categoryId');
            res.render('adminoffer', { offers }); 
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        res.render('404');
    }
};
exports.getaddproductoffer=async (req, res) => {
    try {
        if (req.cookies.adminToken) {
         
            const products = await Productdb.find();
            res.render('addproductoffer', {products  }); 
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        res.render('404');
    }
}
exports.postaddproductoffer = async (req, res) => {
    try {
        if (req.cookies.adminToken) {
            const { product, discount, edate } = req.body;

            const selectedProduct = await Productdb.findById(product);
            if (!selectedProduct) {
                return res.status(404).send('Product not found');
            }

            const newOffer = new Offer({
                productId: product,
                type: 'Product Offer',
                discountPercentage: discount,
                expiryDate: edate
            });

            await newOffer.save();

            // Update the discount of the selected product by adding the new discount value to the existing one
            selectedProduct.discount = Number(selectedProduct.discount) + Number(discount);

            // Recalculate the total_price based on the updated discount
            const discountedPrice = selectedProduct.price * (1 - selectedProduct.discount / 100);
            selectedProduct.total_price = Math.round(discountedPrice);

            await selectedProduct.save();

            res.redirect('/admin/offers');

        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        res.render('404');
    }
}

exports.deleteoffer=async (req, res) => {
    try {
        
        const { id } = req.params;
        const offer = await Offer.findById(id);

        if (offer.type === 'Product Offer') {
            const product = await Productdb.findById(offer.productId);
            product.discount -= offer.discountPercentage;

            const discountedPrice = product.price * (1 - product.discount / 100);
            product.total_price = discountedPrice;

            await product.save();
        } else if (offer.type === 'Category Offer') {
           
            const products = await Productdb.find({ category: offer.categoryId });
            for (const product of products) {
                product.discount -= offer.discountPercentage;

                const discountedPrice = product.price * (1 - product.discount / 100);
                product.total_price = Math.round(discountedPrice);

                await product.save();
            }
        }

        await Offer.findByIdAndDelete(id);

        res.status(200).json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error(error);
        res.render('404');
    }
};

exports.getaddcategoryoffer=async (req, res) => {
    try {
        if (req.cookies.adminToken) {
         
            const categories = await Categorydb.find();

            res.render('addcategoryoffer', {categories  }); 
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        res.render('404');
    }
}
exports.postaddcategoryoffer = async (req, res) => {
    try {
        if (req.cookies.adminToken) {
            const { category, discount, edate } = req.body;

            const categoryProducts = await Productdb.find({ category }); // Find all products belonging to the selected category
            if (categoryProducts.length === 0) {
                return res.status(404).send('No products found in this category');
            }

            // Update discount and total_price for each product in the category
            for (const product of categoryProducts) {
                product.discount = Number(product.discount) + Number(discount);
                const discountedPrice = product.price * (1 - product.discount / 100);
                product.total_price = Math.round(discountedPrice); 
                await product.save();
            }
            
            // Create a new offer for the category
            const newOffer = new Offer({
                categoryId: category,
                type: 'Category Offer',
                discountPercentage: discount,
                expiryDate: edate
            });
            await newOffer.save();

            res.redirect('/admin/offers');
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        res.render('404');
    }
}
exports.getupdateoffer = async (req, res) => {
    try {
        if (req.cookies.adminToken) {
            const { offerId } = req.query; // Assuming offerId is passed in the query parameters

            // Query the offer document based on its _id
            const offer = await Offer.findById(offerId).populate('productId').populate('categoryId');
            if (!offer) {
                return res.status(404).json({ message: 'Offer not found' });
            }

            // Check the type of the offer
            if (offer.type === 'Product Offer') {
                const products = await Productdb.find();
                res.render('editproductoffer', { offer,products }); // Pass the offer data to the template
            } else if (offer.type === 'Category Offer') {
                const categories = await Categorydb.find();
                res.render('editcategoryoffer', { offer,categories}); // Pass the offer data to the template
            } else {
                // Handle other cases or invalid type
                res.status(400).json({ message: 'Invalid offer type' });
            }
        } else {
 
            res.status(404).render('404');
        }
    } catch (error) {
        console.error(error);
        res.render('404');
    }
}
exports.posteditoffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { category, discount, edate } = req.body;
        console.log(category)

        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        if (offer.type === 'Product Offer') {
            const product = await Productdb.findById(offer.productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            product.discount -= Number(offer.discountPercentage);  
            product.discount += Number(discount);  

            const discountedPrice = product.price * (1 - product.discount / 100);
            product.total_price = Math.round(discountedPrice);

            await product.save();

        } else if (offer.type === 'Category Offer') {
            const categoryProducts = await Productdb.find({ category: offer.categoryId });
            if (categoryProducts.length === 0) {
                return res.status(404).send('No products found in this category');
            }

            for (const product of categoryProducts) {
                product.discount -= Number(offer.discountPercentage); // Convert to number
                product.discount += Number(discount); // Convert to number

                const discountedPrice = product.price * (1 - product.discount / 100);
                product.total_price = Math.round(discountedPrice);

                await product.save();
            }
        } else {
            return res.status(400).json({ message: 'Invalid offer type' });
        }

        offer.discountPercentage = Number(discount); // Convert to number

        await offer.save();

        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.render('404');
    }
}
