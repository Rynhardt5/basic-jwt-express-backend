const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// middleware that is specific to this router
// router.use(function timeLog(req, res, next) {
//   console.log('Time: ', Date.now());
//   next();
// });

// @routes    GET /users/current
// @desc      Return current user
// @access    Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

// @routes    POST /users/register
// @desc      Create a new user and return JWT
// @access    Public
router.post(
  '/register',
  [
    check('email').isEmail().withMessage('Please enter a valid email address'),
    check('password').notEmpty().withMessage('Please enter your password'),
  ],
  async (req, res) => {
    // get values from post req check if valid
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          errors: [{ msg: 'User already registered please sign in instead' }],
        });
      }

      user = new User({
        email,
        password,
      });

      // gen salt
      const salt = await bcrypt.genSalt(10);

      // hash pw
      user.password = await bcrypt.hash(password, salt);
      // save user
      await user.save();

      // Send JWT
      jwt.sign(
        {
          id: user.id,
        },
        process.env.SECRET_KEY,
        {
          expiresIn: 3600,
        },
        (err, token) => {
          res.status(200).json({
            seccess: true,
            token: 'Bearer ' + token,
          });
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
);

// @routes    POST /users/login
// @desc      Log a user in and return JWT token
// @access    Public
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Please enter a valid email address'),
    check('password').notEmpty().withMessage('Please enter your password'),
  ],
  async (req, res) => {
    // get values from post req check if valid
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          errors: [{ msg: `Your email isn't registed` }],
        });
      }

      // Check password
      const passwordIsValid = await bcrypt.compare(password, user.password);

      if (passwordIsValid) {
        jwt.sign(
          {
            id: user.id,
          },
          process.env.SECRET_KEY,
          {
            expiresIn: 3600,
          },
          (err, token) => {
            return res.status(200).json({
              seccess: true,
              token: 'Bearer ' + token,
            });
          }
        );
      } else {
        return res.status(422).json({
          errors: [{ msg: 'Password is incorrect, please try again' }],
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

router.get('/', function (req, res) {
  res.send('user home page');
});

module.exports = router;
