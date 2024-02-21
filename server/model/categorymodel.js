const mongoose =require('mongoose');

var Categoryschema = new mongoose.Schema({
    category: { 
        type: String,
         required: true,
         },
    list: {
            type: String,
            default: 'listed'
        },  
    description: { 
        type: String },
})

const Categorydb = mongoose.model('categorydb',Categoryschema);

module.exports = Categorydb;