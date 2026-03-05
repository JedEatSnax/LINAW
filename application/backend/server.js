require("dotenv").config()

const express = require("express");
//const { initializeApp, applicationDefault } = require('firebase-admin/app')

const app = express()
const port = '3000'

/*
initializeApp({
    credential: applicationDefault()
});
*/

/*
const cors = require("cors")
const corsOptions = {
    origin: ["http://localhost:5173"]
}
app.use(cors(corsOptions))
*/

app.get("/api", (req, res) => {
    res.json({ assets: ["vehicle", "real estate", "cash"] })
})

app.use(express.json())
app.use('/api', usersRouter);
app.use('/api', networkRouter)

app.listen(port, () => {
    console.log(`Express running on port ${port}`)
})