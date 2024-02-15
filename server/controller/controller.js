const { query } = require('express');
var Userdb =require('../model/model');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');


// Configure Nodemailer (replace with your SMTP settings)
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
   if(req.session.user){
      res.redirect('/');
  }
  else if(req.cookies.adminToken){
      res.redirect('/admin/manage');
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

