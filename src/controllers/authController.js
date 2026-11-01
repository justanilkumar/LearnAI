const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, headline, bio } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      headline,
      bio
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        headline: user.headline
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        headline: user.headline,
        bio: user.bio
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let extraStats = {};

    if (user.role === 'student') {
      const enrollmentsCount = await Enrollment.countDocuments({ student: user._id });
      const completedCount = await Enrollment.countDocuments({
        student: user._id,
        status: 'completed'
      });
      extraStats = { enrollmentsCount, completedCount };
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        headline: user.headline,
        bio: user.bio,
        createdAt: user.createdAt,
        ...extraStats
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Quick demo switch accounts (For interview demonstrations & testing)
// @route   GET /api/auth/demo-users
// @access  Public
exports.getDemoUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('name email role avatar headline');
    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, headline, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, headline, bio, avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        headline: user.headline,
        bio: user.bio
      }
    });
  } catch (err) {
    next(err);
  }
};
