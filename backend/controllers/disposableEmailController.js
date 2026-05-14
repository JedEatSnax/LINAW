const disposableService = require("../service/application/disposableEmailService");

exports.check = async (req, res, next) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res
        .status(400)
        .json({ ok: false, error: "email parameter is required" });
    }

    const result = await disposableService.checkEmail(email);

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
};
