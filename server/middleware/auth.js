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
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await Userdb.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      user = new Userdb({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'defaultPassword'
      });
      await user.save();
    }
    const userToken = jwt.sign({ userId: user.email }, 'your_secret_key', { expiresIn: '1h' });

    done(null, { user, userToken });
  } catch (error) {
    done(error, null);
  }
}));


passport.serializeUser((user, done) => {
  const sessionUser = {
    id: user._id,
    name: user.name,
    email: user.email
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