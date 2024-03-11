const axios= require('axios');
const Userdb = require('../model/model');
const connectDB = require('../database/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');

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
exports.forgototp= async (req,res)=>{
    if(req.cookies.userToken){
        const user = await Userdb.findOne({ email: req.session.email });
        console.log(user);
        
        if (!user) {
         res.redirect('/useraccount');
         }
         else{
         const recipientEmail = user.email || user.googleId; // Replace with the recipient's email address
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
                         res.render('forgototp',{ userToken: req.cookies.userToken,user: user,email: user._id, message:'' }); // Render a success page with the OTP
                     }
                 })
              }
   }
   else if(req.cookies.adminToken){
       res.redirect('/admin/manage');
   }
    
  }
exports.verotp= async (req,res)=>{
    if (req.cookies.userToken && req.session.otp) {
        
        const otp= req.body.otp;
        if(otp==req.session.otp){
            const user = await Userdb.findOne({ email: req.session.email }); 
            res.render('forgotpassword',{userToken: req.cookies.userToken,user: user,message:''})
        }
        else{
            res.render('forgototp',{ email: user._id,userToken: req.cookies.userToken,user: user, message:'Otp is not matching' });
        }
    } else if (req.cookies.adminToken) {
        res.redirect('/admin/manage');
    }
}
exports.setNewPassword = async (req, res) => {
    const { confirmPassword, newPassword } = req.body;

    try {
        const user = await Userdb.findOne({ email: req.session.email });

        if (!user) {
            return res.status(404).send('User not found'); 
        }

        if (newPassword !== confirmPassword) {
           res.render('forgotpassword', { userToken: req.cookies.userToken, user: user, message: "Passwords do not match." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        // Redirect or render success message
        return res.render('forgotpassword', { userToken: req.cookies.userToken, user: user, message: "Password successfully changed." });
    } catch (error) {
        console.error(error);
        return  res.render('404');
    }
}
