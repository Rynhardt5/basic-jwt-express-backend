const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_KEY,
};

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const filterValues = {
          //   __v: false,
          password: false,
        };

        const user = await User.findById(jwt_payload.id, filterValues);

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        console.log(error);
      }
    })
  );
};
