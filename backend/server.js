const express = require("express");

require('./db/knex');
const app = express()
const port = '3000'


// Don't delete this. It's the import of the modules for the endpoints 
const { router: usersRouter } = require('./routes/usersRoute');
const { router: fabricRouter } = require('./routes/fabric.route') 

const cors = require("cors") 
const corsOptions = {
    origin: ["http://localhost:5173"]
}
app.use(cors(corsOptions))

app.use(express.json())
app.use('/api', usersRouter);
app.use('/api', fabricRouter)

app.listen(port, () => {
    console.log(`🚀 Express running on port ${port}`)
})

