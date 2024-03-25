const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userdb'
    },
    items: [{
        productId: {
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
    orderedDate: {
        type: Date,
        default: () => new Date().toISOString().split('T')[0]
    },
    deliveredDate: {
        type: Date
    },
    expectedDeliveryDate: {
        type: Date
    },
    status: {
        type: String,
        default: 'Order Placed'
    },
    shippingAddress: {
        type: {}
    },
    paymentMethod: {
        type: String
    },
    paymentStatus: {
        type: String,
        default: "Pending"
    },
    totalAmount: {
        type: Number,
        required: true
    },
    couponused: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "coupondb"
    }
});

// Function to generate a unique order ID
async function generateUniqueOrderId() {
    const characters = '0123456789';
    let orderId = '';
    let exists = true;
    while (exists) {
        orderId = '';
        for (let i = 0; i < 10; i++) {
            orderId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        exists = await Orderdb.exists({ orderId: orderId }); // Check if orderId already exists in the database
    }
    return orderId;
}

// Pre-save hook to generate unique orderId before saving the document
orderSchema.pre('save', async function(next) {
    if (!this.orderId) {
        this.orderId = await generateUniqueOrderId();
    }
    next();
});

const Orderdb = mongoose.model('orderdb', orderSchema);

module.exports = Orderdb;
