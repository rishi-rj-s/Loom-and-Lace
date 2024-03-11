const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Cartdb =require('../model/cartmodel');
const multer = require('multer');
const sharp = require('sharp');
const path= require('path');
const Userdb = require('../model/model');

// // Multer configuration for file upload
// const upload = multer({
//     limits: {
//         fileSize: 10 * 1024 * 1024, // 10MB limit per file
//     },
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.startsWith('image/')) {
//             cb(null, true);
//         } else {
//             cb(new Error('Only images are allowed'));
//        }
//     },
//   });
  
  exports.createproduct = async (req, res) => {
    // Check if request body and files exist
    if (!req.body) {
        res.render('404');
        return;
    }
    
    const images = req.files.map(file => file.path);

    const price = parseInt(req.body.price);
    const discount = parseInt(req.body.discount) || 0; // Set default discount to 0 if not provided or invalid

    if (isNaN(price) || isNaN(discount)) {
        res.render('404');
        return;
    }

    // Calculate total_price
    const total_price = Math.round(price * (1 - discount / 100));

    try {
        console.log(req.body.category)
        // Find the category ObjectId based on the category name provided in the request
        const category = await Categorydb.findOne({ category: req.body.category });

        if (!category) {
            res.status(404).send({ message: "Category not found" });
            return;
        }

        // Create a new product instance
        const product = new Productdb({
            product_name: req.body.p_name,
            category: category, // Assign the ObjectId of the category
            brand: req.body.brand,
            price: price,
            color: req.body.color,
            size: req.body.size,
            description: req.body.stat,
            discount: discount,
            stock: req.body.stock,
            images: images,
            total_price: total_price,
        });

        // Save the product to the database
        await product.save();

        res.redirect('/products');
    } catch (error) {
        res.status(500).send({
            message: error.message || "Some error occurred while creating the product."
        });
    }
};


//retrieve and return productss
exports.find = (req, res) => {
    if (req.query.id) {
        const id = req.query.id;

        Productdb.findById(id)
            .populate('category') // Populate the category field with the category name
            .then(data => {
                if (!data) {
                    res.status(404).send({ message: `Not found product with id ${id}` })
                } else {
                    res.send(data)
                }
            })
            .catch(err => {
                res.status(500).send({ message: "Error retrieving product with id" + id })
            })
    } else {
        Productdb.find()
            .then(products => {
                res.send(products)
            })
            .catch(err => {
                res.status(500).send({ message: err.message || "Error occur while retrieving product information" })
            })
    }
}
exports.update = async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedProductData = req.body;
        const images = req.files;

        // Fetch the product by ID
        let product = await Productdb.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Update product details
        product.product_name = updatedProductData.p_name;
        product.category = updatedProductData.category;
        product.brand = updatedProductData.brand;
        product.color = updatedProductData.color;
        product.size = updatedProductData.size;
        product.price = updatedProductData.price;
        product.discount = updatedProductData.discount;
        product.stock = updatedProductData.stock;
        product.description = updatedProductData.stat;

        if (updatedProductData.deletedImages && updatedProductData.deletedImages.length > 0) {
            updatedProductData.deletedImages.split(',').forEach(image => {
                const index = product.images.indexOf(image);
                if (index !== -1) {
                    product.images.splice(index, 1);
                }
            });
        }

        if (images && images.length > 0) {
            product.images = product.images.concat(images.map(image => image.path));
        }

        // Recalculate total_price based on new price and discount
        product.total_price = calculateTotalPrice(updatedProductData.price, updatedProductData.discount);

        // Save the updated product
        await product.save();
        res.redirect('/products');
    } catch (error) {
        console.error("Error updating product:", error);
        res.render('404');
    }
};


function calculateTotalPrice(price, discount) {
    return Math.round(price - (price * discount / 100));
}


exports.delete= (req,res)=>{
    const id= req.params.id;

    Productdb.findByIdAndDelete(id)
    .then(data =>{
        if(!data){
            res.status(404).send({message:  `Cannot delete with id ${id}.Id may be wrong`})
        }else{
            res.send({
                message: "Product was was deleted successfully!!!"
            })
        }
    })
    .catch(err=>{
        res.status(500).send({ message: "Could not delete user with id "+id});
    });
}
exports.imagedelete= async (req, res) => {
  try {
      const productId = req.params.productId;
      const index = req.params.index;

      // Fetch the product by ID
      let product = await Productdb.findById(productId);

      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }

      // Ensure the index is valid
      if (index < 0 || index >= product.images.length) {
          return res.status(400).json({ message: "Invalid image index" });
      }

      // Remove the image at the specified index
      product.images.splice(index, 1);

      // Save the updated product
      await product.save();

      res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
      console.error("Error deleting image:", error);
      res.render('404');
  }
}
