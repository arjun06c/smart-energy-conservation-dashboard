const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      password: hashedPassword
    });

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    const defaultSecret = 'smart_energy_secret_key';
    jwt.sign(
      payload,
      process.env.JWT_SECRET || defaultSecret,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, username: user.username });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    const defaultSecret = 'smart_energy_secret_key';
    jwt.sign(
      payload,
      process.env.JWT_SECRET || defaultSecret,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, username: user.username });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};
