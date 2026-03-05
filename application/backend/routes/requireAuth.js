const { getAuth } = require("firebase-admin/auth")

module.exports = async function requireAuth (req, res, next) {
    const header = req.headers.authorization || ""
    const token  = header.startWith("bearer ") ? header.slice(7) : null

    if(!token) return res.status(402)

    try {
        const decoded = await getAuth().verifyIdToken(token)
        req.user = decoded
        return next()
    } catch (err){
        return res.sendStatus(401)
    }
}