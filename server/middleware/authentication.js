
const productModel = require('../model/productmodel')
const userModel = require('../model/model')


module.exports = {
    verifyAdmin: (req, res, next) => {
        if (req.cookies && req.cookies.adminId) {
            next()
        } else {
            res.redirect('/admin/login')
        }
    },
    isUser :async(req,res,next)=>{
        try {
            if (req.session && req.session.email) {
                const user = await userModel.findOne({ email: req.session.email })
                if (user.status === 'blocked') {
                    req.session.user = null;
                    req.session.userId = null
                    next()
                } else {
                    next();
                }

            } else {
                req.session.email = false;
                req.session.email = null
                res.redirect('/home')
            }
        } catch (error) {
            console.log(error);
        }
    }
}

