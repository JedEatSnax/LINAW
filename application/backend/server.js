require("dotenv").config()

const express = require("express");
//const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { Sequelize } = require('sequelize')

const app = express()
const port = '3000'

/*
initializeApp({
    credential: applicationDefault()
});
*/

// Don't delete this. It's the import of the modules for the db and all
const { router: usersRouter } = require('./routes/users.route');
const { router: networkRouter } = require('./routes/network.route') 


const sequelize = new Sequelize('postgres','linawAdmin@pgAdmin.com', 'linawAdmin',{
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
})

/*
const cors = require("cors")
const corsOptions = {
    origin: ["http://localhost:5173"]
}
app.use(cors(corsOptions))
*/

app.use(express.json())
app.use('/api', usersRouter);
app.use('/api', networkRouter)

sequelize.authenticate()
    .then(() => 
        console.log('Connected to Postgres SQL (Docker)'),
    
    sequelize.sync()
        .then(() => {
            app.listen(port, () => {
                console.log(`Express running on port ${port}`)
            })
        })
)

