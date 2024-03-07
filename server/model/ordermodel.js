const mongoose =require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: uuidv4, // Remove the function invocation here
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'userdb'
    },
    items:[{
        productId :{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productdb'
        },
        price: {
            type: Number
        },
        quantity: {
            type: Number
        }
    }],
    orderedDate : {
        type: Date,
        default: () => new Date().toISOString().split('T')[0]
    },
    deliveredDate : {
        type: Date
    },
    expectedDeliveryDate:{
        type: Date
    },
    status:{
        type: String,
        default: 'Order Placed'
    },
    shippingAddress:{
        type: {}
    },
    paymentMethod:{
        type: String  
    },
    paymentStatus:{
        type: String,
        default: "Pending"
    },
    totalAmount:{
        type: Number,
        required: true
    },
    couponused: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "coupondb"
    },

})
const Orderdb = mongoose.model('orderdb', orderSchema)

module.exports = Orderdb;