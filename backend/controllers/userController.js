const userService = require('../service/application/userService')

class userController {
    async signup(req, res, next) {
    try {
        const userResult = await userService.signup(req.body);

        // userService.signup returns either the user object or existing user
        const user = userResult?.user || userResult;

        if (!user) {
          return res.status(400).json({ message: 'Signup failed' });
        }

        return res.status(201).json({
          message: 'Signup successful',
          data: user,
        });
    } catch (err) {
      return next(err);
    }
  }

  async syncUser(req, res, next) {
    try {
      const result = await userService.syncAuthenticatedUser({
        firebase_uid: req.user?.uid,
        email: req.user?.email,
        tenant_id: req.user?.tenantId || null,
      });

      return res.status(result.created ? 201 : 200).json({
        message: result.created ? 'User synced successfully' : 'User already exists',
        data: result.user,
      });

    } catch (error) {
      if (error.message === "FIREBASE_UID_REQUIRED") {
        return res.status(400).json({ message: "Firebase UID is required" });
      }

      if (error.message === "EMAIL_REQUIRED") {
        return res.status(400).json({ message: "Email is required" });
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return res.status(409).json({ message: "Email already exists" });
      }

      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      /* 
        login can stay public; sync-user owns the trusted Firebase identity binding.
      */
      const { email } = req.body || {};

      const userRow = await userService.login(email);

      if (!userRow) {
        return res.status(400).json({ message: 'login failed' });
      }

      return res.status(200).json({ message: 'Login Successful', data: userRow });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new userController();
