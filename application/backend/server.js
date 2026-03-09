const express = require("express");
//const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { Sequelize } = require('sequelize')
const path = require('path');
require ('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
})


const app = express()
const port = '3000'

/*
initializeApp({
    credential: applicationDefault()
});
*/

// Don't delete this. It's the import of the modules for the endpoints 
const { router: usersRouter } = require('./routes/users.route');
const { router: networkRouter } = require('./routes/network.route') 


const sequelize = new Sequelize(process.env.DATABASE_URL, {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false  // Optional: quiet logs
});
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
        console.log('✅ Connected to Postgres SQL (Docker)'),
    
    sequelize.sync()
        .then(() => {
            app.listen(port, () => {
                console.log(`🚀 Express running on port ${port}`)
            })
        })
    .catch(err => {
        console.log('❌ DB CONNECTION FAILED:', err)
    })
)

