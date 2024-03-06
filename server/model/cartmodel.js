
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'userdb',
        required: true
    },
    items: [{
        productId : {
            type: mongoose.Schema.Types.ObjectId,
            ref:'productdb',
            required : true
        },
        quantity : {
            type: Number
        }
    }],
    couponApplied:{
            type: Boolean,
            default: false
    },
    totalAmount : {
        type : Number
    },
    totalDiscount : {
        type : Number
    },
}, { timestamps: true }); 
const Cartdb = mongoose.model('Cartdb', cartSchema);

module.exports = Cartdb;
