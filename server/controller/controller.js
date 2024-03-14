const { query } = require('express');
const Userdb =require('../model/model');
const Addressdb =require('../model/addressmodel');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Cartdb =require('../model/cartmodel');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'asifsalim0000@gmail.com',
        pass: process.env.APP_PASSWORD,
    },
});
// Generate a random 5-digit OTP
function generateOTP() {
    const length = 5; // Set the desired length of the OTP
    const digits = '0123456789'; // Only digits (0-9)

    let otp = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits.charAt(randomIndex);
    }

    return otp;
}

exports.signup= async (req,res)=>{
   if(req.cookies.userToken){
      res.redirect('/');
  }
   else if(req.session.otp){
      delete req.session.otp;
      res.render('signup',{message:''});
    }
    //validate request
    const existingUser = await Userdb.findOne({ email: req.body.email });
    
   req.session.uname= req.body.name;
   req.session.uemail= req.body.email;
   req.session.upass =req.body.password;
   req.session.gender= req.body.gender;
   
   if (existingUser) {
    res.render('signup', { message: 'Email already exists. Please choose a different email.' });
    }
    else{
    const recipientEmail = req.body.email; // Replace with the recipient's email address
            const otp = generateOTP();
            req.session.otp = otp;
            transporter.sendMail({
                from: 'asifsalim0000@gmail.com',
                to: recipientEmail,
                subject: 'Your OTP for Verification',
                text: `Your OTP is: ${otp}`,
            }, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    res.status(500).send('Error sending OTP via email.');
                } else {
                    console.log('OTP sent successfully:', info.response);
                    res.render('otp',{ email: req.body.email, message:'' }); // Render a success page with the OTP
                }
            })
         }
 }
 exports.resendotp=async (req, res) => {
    try {
        // Retrieve user's email from session or request body
        const recipientEmail = req.session.uemail || req.body.email;

        // Generate a new OTP
        const otp = generateOTP();
        req.session.otp = otp;

        // Send the OTP via email
        transporter.sendMail({
            from: 'asifsalim0000@gmail.com',
            to: recipientEmail,
            subject: 'Your OTP for Verification',
            text: `Your new OTP is: ${otp}`,
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Error sending OTP via email.');
            } else {
                console.log('OTP resent successfully:', info.response);
                res.render('otp', { email: recipientEmail, message: 'OTP resent successfully.' });
            }
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).send('Error resending OTP.');
    }
}

//retrieve and return users
exports.find= (req,res)=>{
   if(req.query.id){
      const id= req.query.id;
     
      Userdb.findById(id)
      .then(data =>{
       if(!data){
           res.status(404).send({message: `Not found user with id ${id}`})
       }else{
           res.send(data)
       }
      })
      .catch(err=>{
       res.status(500).send({message: "Error retreiving user with id"+id})
      })
   }else{
       Userdb.find()
   .then(user=> {
      res.send(user)
   })
   .catch(err=>{
       res.status(500).send({message: err.message||"error occur while retreiving user information"})
   })
   }
}

//create and save new user
exports.create= (req,res)=>{
   //validate request
   if(!req.body){
    res.status(400).send({message: "Content cannot be empty"});
    return;
   }
   
   //new user
   const user= new Userdb({
    name : req.body.name,
    email: req.body.email,
    gender: req.body.gender
   })

   //save user in db
   user 
     .save(user)
     .then(data =>{
        // res.send(data)
        res.redirect('/add-user')
     })
     .catch(err=>{
        res.status(500).send({
            message: err.message|| "some error occured while creating operation"
        })
     })
}
exports.updateuser=async (req,res)=>{
    const userId= req.params.id;
    const updatedUserData = req.body;
    if (req.cookies.userToken) {
    let user = await Userdb.findById(userId);
    if (!user) {
        // Handle case where user is not found
        console.error("User not found");
        // Render an error page or redirect to a relevant route
        return res.status(404).render('error', { message: 'User not found' });
    }
    user.name = updatedUserData.name;
    if(user.googleId){
    user.googleId= updatedUserData.email;
    }
    if(!user.googleId){
        user.email= updatedUserData.email;
        }
    user.gender= updatedUserData.gender;
    await user.save();
    res.redirect('/useraccount');
}
else if (req.cookies.adminToken) {
    res.redirect('/admin/manage');
}
else{
    res.redirect('/home');
}
};
exports.postaddaddress = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Find the user by ID
        let user = await Userdb.findById(userId);
        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        // Create a new address instance
        const newAddress = new Addressdb({
            user: userId, // Use the user's ID
            name: req.body.name,
            mobileNumber: req.body.mob,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            district: req.body.district,
            state: req.body.state,
            landmark: req.body.landmark,
            alternateMobile: req.body.phone,
            addressType: req.body.addressType
        });

        await newAddress.save();

        user.addresses.push(newAddress._id); 

        await user.save();

        res.redirect('/useraddress');
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).render('error', { message: 'Error adding address' });
    }
};
exports.deleteaddress=async (req,res)=>{
    if(req.cookies.userToken){
    const id= req.params.id;
    const user = await Userdb.findOne({ addresses: id });
    user.addresses.pull(id);
    await user.save();
    Addressdb.findByIdAndDelete(id)
    .then(data =>{
        if(!data){
            res.status(404).send({message:  `Cannot delete with id ${id}.Id may be wrong`})
        }else{
            res.send({
                message: "Address was deleted successfully!!!"
            })
        }
    })
    .catch(err=>{
        res.status(500).send({ message: "Could not delete uaddressser with id "+id});
    });
}
}
exports.updateaddress=async (req,res)=>{
    if (req.cookies.userToken) {
        try {
            const user = await Userdb.findOne({ email: req.session.email });
            const adId = req.query.id; 
            const address = await Addressdb.findById(adId); // Fetch address details from the database

            if (!address) {
                return res.status(404).send({ message: `address with ID ${adId} not found` });
            }

            // Render the editaddress view and pass the address details and categories as data
            res.render('editaddress', { address,userToken: req.cookies.userToken ,user: user});
        } catch (error) {
            res.render('404');
        }
    }
}
exports.posteditaddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const updatedAddressData = req.body;

        // Fetch the product by ID
        let address = await Addressdb.findById(addressId);

        if (!address) {
            return res.status(404).json({ message: "address not found" });
        }

            address.name= updatedAddressData.name;
            address.mobileNumber= updatedAddressData.mob;
            address.pincode= updatedAddressData.pin;
            address.locality= updatedAddressData.locality;
            address.address= updatedAddressData.address;
            address.district= updatedAddressData.district;
            address.state= updatedAddressData.state;
            address.landmark= updatedAddressData.landmark;
            address.alternateMobile= updatedAddressData.phone;



        await address.save();
        res.redirect('/useraddress');
    } catch (error) {
        console.error('Error adding address:', error);
        res.render('404');
    }
};
exports.shopfilter=async (req, res) => {
    try {
       
        const products = await Productdb.find();
        const categories = await Categorydb.find();
         if (req.cookies.userToken) {
            try {
                const email= req.session.email;
                console.log(req.session.email);
                const user = await Userdb.findOne({ email: email });
 
                const userToken = req.cookies.userToken;
                res.render('shopfilter', { userToken: userToken, products: products, categories: categories,user: user });
            } catch (error) { 

                console.error(error);
                res.render('shopfilter', { title: "LOOM",userToken: undefined, products: products, categories: categories });
            }
        } else {
            res.render('shopfilter', { userToken: undefined, products: products, categories: categories });
        }
    } catch (error) {
        console.error(error);
        res.render('404');    }
}
exports.getSortedProducts = async (req, res) => {
        const { sortBy } = req.params;
        const { categories } = req.body;
    
        try {
            let sortedAndFilteredProducts;
            const user = await Userdb.findOne({ email: req.session.email });
    
            // Convert category names to ObjectId values
            const categoryIds = await Categorydb.find({ category: { $in: categories } }).distinct('_id');
    
            switch (sortBy) {
                case 'popularity':
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }}).sort({_id:1});
                    break;
                case 'price-low-to-high':
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }}).sort({ total_price: 1 });
                    break;
                case 'price-high-to-low':
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }}).sort({ total_price: -1 });
                    break;
                case 'a-to-z':
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }}).sort({ product_name: 1 });
                    break;
                case 'z-to-a':
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }}).sort({ product_name: -1 });
                    break;
                case 'newest-first':
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }}).sort({ _id: -1 });
                    break;
                default:
                    sortedAndFilteredProducts = await Productdb.find({ category: { $in: categoryIds }});
            }
    
            res.json(sortedAndFilteredProducts);
        } catch (error) {
            console.error(error);
            res.render('404');
        }
    };
    