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
        await client.connect();
        console.log('data base connected');
        const collection = client.db("inventory").collection("products");

        app.get('/inventories', async (req, res) => {
            const limit = req.query.limit || 100
            const query = {}
            const cursor = collection.find(query)
            const result = await cursor.limit(parseInt(limit)).toArray()
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(500).send({ message: 'server error' })
            }
        })
        app.get('/recent', async (req, res) => {
            const query = {}
            const cursor = collection.find(query).sort({ _id: -1 }).limit(3)
            const result = await cursor.toArray()
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(500).send({ message: 'server error' })
            }
        })

        // post inventory
        app.post('/inventories', async (req, res) => {

            const { image, name, price, quantity, supplier, description, email } = req.body
            const newInventory = { image, name, price, quantity, supplier, description, email }
            const insert = await collection.insertOne(newInventory)
            if (insert) {
                res.status(200).send(insert)
            }




        })

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