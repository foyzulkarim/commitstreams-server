const isAuthorized = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    console.log('User is not an admin.', { _id: req.user._id });
    res.status(403).json({
      message: 'Access denied. You are not an admin.',
    });
  }
};

module.exports = { isAuthorized };
