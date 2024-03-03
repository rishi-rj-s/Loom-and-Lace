const mongoose =require('mongoose');

var couponSchema = new mongoose.Schema({
    couponcode:{
        type:String
    },
    discount:{
        type:Number
    },
    expiredate:{
        type:Date
    },
    purchaseamount:{
        type:Number
    },
})
const Coupondb = mongoose.model('coupondb',couponSchema);

module.exports = Coupondb;