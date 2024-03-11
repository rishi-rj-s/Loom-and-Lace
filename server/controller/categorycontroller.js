const { query } = require('express');
const Categorydb =require('../model/categorymodel');

exports.catcreate=async (req,res)=>{
    //validate request
    if(!req.body){
     res.status(400).send({message: "Content cannot be empty"});
     return;
    }
    // const catname=req.body.cat_name;

    let category = await Categorydb.findOne({category: req.body.cat_name})
    if(category){
        res.render('addcategory', { message: 'Category already exists' });
    }
    //new category
    else{
    category= new Categorydb({
     category : req.body.cat_name,
     description: req.body.cat_stat,
    })

 
    //save user in db
    category 
      .save(category)
      .then(data =>{
         // res.send(data)
         res.redirect('/admin/categories')
      })
      .catch(err=>{
         res.status(500).send({
             message: err.message|| "some error occured while creating operation"
         })
      })
    }
 }

 exports.getCategories = async (req, res) => {
    try {
        // Fetch all categories from the Categorydb collection
        const categories = await Categorydb.find();
 
        // Render the category EJS template and pass the categories data
        res.render('category', { categories });
    } catch (error) {
        console.error(error);
        res.render('404');
    }
};
exports.delete= (req,res)=>{
    const id= req.params.id;

    Categorydb.findByIdAndDelete(id)
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
exports.getupdateCategory = async (req, res) => {
    if (req.cookies.adminToken) {
        try {
            const categoryId = req.query.id; 
            const categories = await Categorydb.findById(categoryId); // Fetch product details from the database

            // Render the editproduct view and pass the product details and categories as data
            res.render('editcategory', { categories ,message:''});
        } catch (error) {
            res.status(500).send({ message: error.message || "Some error occurred while fetching product details or categories." });
        }
    }
};
exports.postupdateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const updatedCategoryData = req.body;
        const categories = await Categorydb.findById(categoryId);
        // Fetch the product by ID
        let category = await Categorydb.findOne({category: req.body.cat_name})
        if(category){
        return res.render('editcategory', { categories,message: 'Category already exists' });
        }

        // Update product details
        categories.category = updatedCategoryData.cat_name;
        categories.description = updatedCategoryData.cat_stat;
        // Save the updated product
        await categories.save();
        res.redirect('/admin/categories');
        // res.status(200).json({ message: "Product updated successfully", product: product });
    } catch (error) {
        console.error("Error updating product:", error);
        res.render('404');
    }
};