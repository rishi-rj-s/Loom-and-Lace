const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Addressdb =require('../model/addressmodel');
const Cartdb =require('../model/cartmodel');
const Orderdb =require('../model/ordermodel');
const Coupondb =require('../model/couponmodel');
const multer = require('multer');
const sharp = require('sharp');
const path= require('path');
const Userdb = require('../model/model');

exports.getadminCoupons=async(req,res)=>{
    const coupons= await Coupondb.find();
    res.render('coupons',{coupons})
}
exports.getaddcoupon=async(req,res)=>{
    res.render('addcoupon')
}
exports.createcoupon=async(req,res)=>{
    try {
        const data = {
            couponcode: req.body.code,
            discount: req.body.discount,
            expiredate: formatDate(req.body.edate),
            purchaseamount: req.body.purchaseamount
        }
        await Coupondb.insertMany([data])
            .then((result) => {
                res.redirect('/admin/coupons')
            })

    } catch (error) {
        console.log(error);
    }
    function formatDate(inputDate) {
        const date = new Date(inputDate);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }
}
exports.delete=async(req,res)=>{
    const id= req.params.id;

    Coupondb.findByIdAndDelete(id)
    .then(data =>{
        if(!data){
            res.status(404).send({message:  `Cannot delete with id ${id}.Id may be wrong`})
        }else{
            res.send({
                message: "Coupon was was deleted successfully!!!"
            })
        }
    })
    .catch(err=>{
        res.status(500).send({ message: "Could not delete user with id "+id});
    });
}
exports.getupdatecoupon=async(req,res)=>{
    if (req.cookies.adminToken) {
        try {
            const couponId = req.query.id; 
            const coupon = await Coupondb.findById(couponId); // Fetch coupon details from the database

            if (!coupon) {
                return res.status(404).send({ message: `coupon with ID ${couponId} not found` });
            }


            // Render the editcoupon view and pass the coupon details and categories as data
            res.render('editcoupon', { coupon });
        } catch (error) {
            res.status(500).send({ message: error.message || "Some error occurred while fetching coupon details or categories." });
        }
    }
}
exports.postupdatecoupon=async(req,res)=>{
    if (req.cookies.adminToken) {
    try {
        const couponId = req.params.id;
        const updatedCoupondata = req.body;
        const coupon = await Coupondb.findById(couponId);

        coupon.couponcode = updatedCoupondata.code;
        coupon.discount = updatedCoupondata.discount;
        coupon.expiredate = updatedCoupondata.edate;
        coupon.purchaseamount = updatedCoupondata.purchaseamount;

        await coupon.save();
        res.redirect('/admin/coupons');
        // res.status(200).json({ message: "Product updated successfully", product: product });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
}
exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        
        const user = await Userdb.findOne({ email: req.session.email });
        const cart = await Cartdb.findOne({ user: user._id });
        
        if (couponCode === "selectcoupon") {
            return res.json({ message: 'Coupon applied successfully', newTotal: cart.totalDiscount });
        }

        const coupon = await Coupondb.findOne({ couponcode: couponCode });
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const newTotal = cart.totalDiscount - coupon.discount;
        // Return the new total and coupon amount to the client
        res.json({ message: 'Coupon applied successfully', newTotal, couponAmount: coupon.discount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
