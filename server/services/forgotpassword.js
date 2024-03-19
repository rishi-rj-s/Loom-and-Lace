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
exports.getforgotpage= async (req,res)=>{
    if(req.cookies.userToken){
        res.redirect('/home');
    }
    else{
        res.render('forgotloginpage');
    }
}
exports.loginforgotpassword = async (req, res) => {
    try {
        if (req.cookies.userToken) {
            return res.redirect('/home');
        }
        const user = await Userdb.findOne({ email: req.body.email });
        req.session.veremail= req.body.email;
        if (!user) {
            return res.redirect('/loginpage');
        }

        const otp = generateOTP();

        req.session.otp = otp;

        transporter.sendMail({
            from: 'asifsalim0000@gmail.com',
            to: user.email,
            subject: 'Your OTP for Verification',
            text: `Your OTP is: ${otp}`,
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending OTP via email.');
            } else {
                console.log('OTP sent successfully:', info.response);
                return res.render('loginotp', { userToken: req.cookies.userToken, user, email: user._id, message: '' });
            }
        });
    } catch (error) {
        console.error('Error in loginforgotpassword:', error);
        res.status(404).res.render('404');
    }
};
exports.verforgototp= async (req,res)=>{
    if (req.cookies.userToken ) {
        res.redirect('/home')
    } else if(req.session.otp){
        const otp= req.body.otp;
        if(otp==req.session.otp){
            res.render('loginforgot',{userToken: undefined,user: undefined,message:''})
        }
        else{
            res.render('loginotp',{ userToken: undefined,user: undefined, message:'Otp is not matching' });
        }
    }
}
exports.setNewLoginPassword = async (req, res) => {
    const { confirmPassword, newPassword } = req.body;

    try {
        const user = await Userdb.findOne({ email: req.session.veremail });

        if (!user) {
            return res.status(404).send('User not found'); 
        }

        if (newPassword !== confirmPassword) {
           res.render('loginforgot', { userToken: undefined, user: undefined, message: "Passwords do not match." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();
       
        res.render('loginforgot', { userToken: undefined, user: undefined, message: "Password successfully changed." });
    } catch (error) {
        console.error(error);
        return  res.render('404');
    }
}

exports.resendotppass=async (req, res) => {
    try {
        const user = await Userdb.findOne({ email: req.session.email });
        const recipientEmail = req.session.email;

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
                res.render('forgototp', { email: recipientEmail, message: 'OTP resent successfully.',user,userToken: req.cookies.userToken });
            }
        });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).send('Error resending OTP.');
    }
}
exports.resendpassword = async (req, res) => {
    try {
        if (!req.session.veremail) {
            return res.redirect('/forgotloginpage');
        }

        const user = await Userdb.findOne({ email: req.session.veremail });
        if (!user) {
            return res.redirect('/loginpage');
        }

        const otp = generateOTP();

        req.session.otp = otp;

        transporter.sendMail({
            from: 'asifsalim0000@gmail.com',
            to: user.email,
            subject: 'Your OTP for Verification',
            text: `Your OTP is: ${otp}`,
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending OTP via email.');
            } else {
                console.log('OTP resent successfully:', info.response);
                return res.render('loginotp', { userToken: req.cookies.userToken, user, email: user._id, message: 'OTP resent successfully.' });
            }
        });
    } catch (error) {
        console.error('Error in resendpassword:', error);
        res.status(404).render('404');
    }
};
