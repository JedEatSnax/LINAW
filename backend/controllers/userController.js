const userService = require('../service/application/userService')

class userController {
    async signup(req, res, next) {
    try {
      const email = req.body?.email;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await userService.signup(req.body, req.user);
      if (!user) {
        return res.status(400).json({
          message: "Signup failed",
        });
      }

      return res.status(201).json({
        email: user.email,
        message: "Signup successful",
      });
    } catch (err) {
      return next(err);
    }
  }

  async syncUser(req, res, next) {
    try {
      const result = await authSyncService.syncUser({
        firebase_uid: req.user?.uid,
        email: req.user?.email,
      });

      return res.status(result.created ? 201 : 200).json({
        message: result.created
          ? "User synced successfully"
          : "User already exists",
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
        this is login, the user already has a valid UID from firebase the only thing
        that doesn't need an auth is the signup. 
      */
      const user = await userService.login({
                body: req.body,
            });

      if (!user) {
        return res.status(400).json({
          message: "login failed",
        });
      }

      return res.status(200).json({
        email: user.email,
        message: "Login Successful",
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new userController();
