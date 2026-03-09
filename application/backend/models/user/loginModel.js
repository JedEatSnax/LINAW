const joi = require('joi')

loginSchema = joi.object ({
  email: joi.string().email().required(),
<<<<<<< HEAD
  firebase_uid: joi.string().required()
=======
  firebaseUID: joi.string().required()
>>>>>>> 5fa4339 (refactors the old database implementation to postgres docker)
})

module.exports = loginSchema