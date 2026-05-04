const https = require("https");

const API_KEY =
  process.env.DISPOSABLE_EMAIL_API_1 || process.env.DISPOSABLE_EMAIL_API;

function checkEmail(email) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      return reject(new Error("DISPOSABLE_EMAIL API key not configured"));
    }

    const url = `https://api.apilayer.com/disposable_email/${encodeURIComponent(email)}`;

    const options = {
      method: "GET",
      headers: {
        apikey: API_KEY,
      },
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

module.exports = { checkEmail };
