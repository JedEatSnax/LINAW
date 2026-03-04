const express = require("express");
const app = express()
const port = '5000'
const cors = require("cors")
const corsOptions = {
    origin: ["http://localhost:5173"]
}

app.use(cors(corsOptions))

app.get("/api", (req, res) => {
    res.json({ assets: ["vehicle", "real estate", "cash"] })
})

app.listen(port, () => {
    console.log(`Express running on port ${port}`)
})