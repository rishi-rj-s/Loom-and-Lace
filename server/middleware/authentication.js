
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
            if (req.session.email) {
                const user = await userModel.findOne({ email: req.session.email })
                if (user.status === 'blocked') {
                    req.session.email = null;
                    req.session= null;
                    res.clearCookie('userToken');
                    next()
                } else {
                   next();
                }

            } else {
                req.session.email = null
                req.session= null;
                res.clearCookie('userToken');
                next();
            }
        } catch (error) {
            console.log(error);
        }
    }
}

