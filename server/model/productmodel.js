const mongoose =require('mongoose');

var Productschema = new mongoose.Schema({
    product_name: { 
        type: String,
         required: true
         },
         category: { type: mongoose.Schema.Types.ObjectId, ref: 'categorydb', required: true },
    brand: { 
        type: String },
    price: { 
        type: Number,
         required: true }, 
    color: { 
        type: String },
    size: { 
        type: String },
    description: { 
        type: String },
    discount: { 
        type: Number }, 
    stock: { 
        type: Number,
         required: true }, 
    // image: { 
    //     type: String }, 
    images: { 
        type: [String] },
    total_price: { 
        type: Number }, 
})

const Productdb = mongoose.model('productdb',Productschema);

module.exports = Productdb;