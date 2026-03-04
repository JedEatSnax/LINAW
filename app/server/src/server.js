require("dotenv").config()

const express = require('express')
//const { initializeApp, applicationDefault } = require('firebase-admin/app')

const app = express()
const port = 3000

const { router: usersRouter } = require('./routes/users.route');
const { router: networkRouter } = require('./routes/network.route')


/*
initializeApp({
    credential: applicationDefault()
});
*/

app.use(express.json())
app.use('/api', usersRouter);
app.use('/api', networkRouter)
// app.use('/api', monitoringRouter);


app.listen(port, () => {
    console.log('app listening on port ${port}')
})