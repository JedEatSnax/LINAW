// Post http method

exports.signup = (req, res, next ) => {
    try{
        const { username, email, password } = req.body;
        res.status(200).json({ ok: true })
    }catch(error){
        next(error);
    }
}

exports.login = (req, res, next) => {
    try{
        const {username, password } = req.body
        res.status(200).json({ ok: true })
    }catch(error){
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