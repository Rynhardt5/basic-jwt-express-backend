const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const sgMail = require('../lib/sgMail');
const User = require('../models/User');

// middleware that is specific to this router
// router.use(function timeLog(req, res, next) {
//   console.log('Time: ', Date.now());
//   next();
// });

// @route POST password/recover
// @desc Recover Password - Generates token and Sends password reset email
// @access Public
router.post(
  '/recover',
  [check('email').isEmail().withMessage('Please enter a valid email address')],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      //Check if user with email exists
      let user = await User.findOne({ email: req.body.email });

      if (!user)
        return res.status(401).json({
          errors: [
            {
              msg:
                'The email address ' +
                req.body.email +
                ' is not associated with any account. Double-check your email address and try again.',
            },
          ],
        });
      // Generate and set password reset token
      user.generatePasswordReset();

      // Save the updated user object
      user = await user.save();

      // Send email with password reset link
      const link = `http://${req.headers.host}/password/reset/${user.resetPasswordToken}`;

      const mailOpts = {
        to: user.email,
        from: process.env.FROM_EMAIL,
        subject: 'Password change request',
        text: `Hi ${user.email} \n 
                    Please click on the following link ${link} to reset your password. \n\n 
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      sgMail.send(mailOpts).then(() => {
        res.status(200).json({
          message: 'A reset email has been sent to ' + user.email + '.',
        });
      });
    } catch (err) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route POST password/reset
// @desc Recover Password - Reset Password - Validate password reset token
// @access Public
router.get('/reset/:resetToken', async (req, res) => {
  console.log(req.params.resetToken);
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(401)
        .json({ mes: 'Password reset token is invalid or has expired' });

    res.send(`http://${req.headers.host}/password/reset`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reset', (req, res) => {
  res.send('We are still building a password reset form lol');
});

module.exports = router;
