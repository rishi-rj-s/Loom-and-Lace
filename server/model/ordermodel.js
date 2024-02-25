const mongoose =require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'userdb'
    },
    items:[{
        productId :{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productdb'
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
    }

})
const Orderdb = mongoose.model('orderdb', orderSchema)

module.exports = Orderdb;