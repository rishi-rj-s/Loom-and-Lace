const mongoose =require('mongoose');

const offerSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'productdb'
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'categorydb',
        unique: true
    },
    type: {
        type: String
    },
    discountPercentage: {
        type: Number
    },
    expiryDate: {
        type: Date
    },
    status: {
        type: String,
        default : 'Active'
    }

},{timestamps: true})

const offerModel = mongoose.model('offer', offerSchema) 
module.exports = offerModel