// Post http method
const {createUser, login} = require("../models/userModel")

exports.signup = async (req, res, next ) => {
    try{
        const { username, password } = req.body;
        const user = await createUser({email: username, password})
        res.status(200).json({ ok: true, user })
    }catch(error){
        if(error.message === "EMAIL_ALREADY_EXISTS"){
            return res.status(409).json({ ok: false, error: "EMAIL_ALREADY_EXISTS" })
        }
        next(error);
    }
}

exports.login = async (req, res, next) => {
    try{
        const {username, password } = req.body
        const user = await login ({email: username, password})
        res.status(200).json({ ok: true, user })
    }catch(error){
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
        }
        next(error)
    }
}

exports.logout = (req, res, next) => {
    try {
        res.status(200).json({ ok: true })
    }catch (error){
        next(error)
    }
}

exports.users = (req, res, next) => {
    try{
        res.status(200).json({ ok: true })
    }
    catch(error){
        next(error)
    }
}

exports.tenants = (req, res, next) => {
    try {
        res.status(200).json({ ok: true })
    }catch(error){
        next(error)
    }
}

// get http methods

exports.me = (req, res, next) => {
    try{
        res.status(200).json({ ok: true })
    }catch(error){
        next(error)
    }
}

exports.users = (req, res, next) =>{
    try {
        res.status(200).json({ok: true})
    }catch(error){
        next(error)
    }
}

exports.tenants = (req, res, next) => {
    try {
        res.status(200).json({ok: true})
    }catch (error){
        next(error)
    }
}