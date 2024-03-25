const mongoose =require('mongoose');

var couponSchema = new mongoose.Schema({
    couponcode:{
        type:String
    },
    maxdiscount:{
        type:Number
    },
    expiredate:{
        type:Date
    },
    minpurchaseamount:{
        type:Number
    },
})
const Coupondb = mongoose.model('coupondb',couponSchema);

module.exports = Coupondb;   