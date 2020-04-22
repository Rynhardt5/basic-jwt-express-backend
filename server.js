const express = require('express');
const passport = require('passport');
const cors = require('cors');
const app = express();

// Get environmental vars
require('dotenv').config();

// Connect to database
require('./config/database');

// Passport Config
require('./config/passport')(passport);

// Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Routes
app.use('/user', require('./routes/userRoutes'));

app.listen(
  process.env.PORT,
  console.log(`Server is listening on PORT:${process.env.PORT}`)
);
