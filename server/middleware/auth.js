const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Userdb= require('../model/model')
const jwt = require('jsonwebtoken');

const GOOGLE_CLIENT_ID = '752795929961-vmotfaor8hvfn57ip46eoonslj7eu0bd.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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'

 passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (req, accessToken, refreshToken, profile, done) => { // Add 'req' as the first parameter
  try {
    if (!profile.emails || profile.emails.length === 0 || !profile.emails[0].value) {
      console.error('No valid email found in the Google profile:', profile);
      return done(new Error('No valid email found in the Google profile'), null);
    }

    const userEmail = profile.emails[0].value;
    let user = await Userdb.findOne({ googleId: userEmail });
    
    if (!user) {
      user = new Userdb({
        name: profile.displayName,
        googleId: userEmail
      });
      await user.save();
    }
    const userToken = jwt.sign(
      { email: user.googleId }, 
      'your_secret_key', 
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    console.log("haii", userToken);
    done(null, { user, userToken });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    done(error, null);
  }
}));


passport.serializeUser((user, done) => {
  const sessionUser = {
    name: user.name,
    googleId: user.googleId
  };
  done(null, sessionUser);  
});

passport.deserializeUser(async (sessionUser, done) => {
  try {
    const user = await Userdb.findById(sessionUser.id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});