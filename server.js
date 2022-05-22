const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');


// declare port and app
const port = process.env.PORT || 5000
const app = express()


// middleware 
app.use(cors())
app.use(express.json())

const jwtVerify = (req, res, next) => {
    const token = req.headers.authorization

    jwt.verify(token, process.env.TOKEN_SECRETE, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "token not verify" })
        }
        req.decoded = decoded
        next()
    });

}


// const mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@todo.yuvqo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
       


    } finally {

    }
}

run().catch(console.dir)


// basic route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'server active now' })
})

// port listening
app.listen(port, () => console.log('server is online...'))