const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe");
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
app.get('/jwt-decoded', jwtVerify, (req, res) => {
    const decoded = req.decoded

    res.send(decoded)
    console.log(decoded)
})


// const mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@todo.yuvqo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('data base connected');
        const productCollection = client.db("bikesOnline").collection("products");
        const userCollection = client.db("bikesOnline").collection("user");
        const reviewCollection = client.db("bikesOnline").collection("review");
        const orderCollection = client.db("bikesOnline").collection("order");

        app.get('/products', async (req, res) => {
            const limit = req.query.limit || 100
            const query = {}
            const cursor = productCollection.find(query)
            const result = await cursor.limit(parseInt(limit)).toArray()
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(500).send({ message: 'server error' })
            }
        })
        app.get('/recent', async (req, res) => {
            const query = {}
            const cursor = productCollection.find(query).sort({ _id: -1 }).limit(3)
            const result = await cursor.toArray()
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(500).send({ message: 'server error' })
            }
        })

        // post inventory
        app.post('/products', async (req, res) => {

            const { image, name, price, quantity, supplier, description, email } = req.body
            const newInventory = { image, name, price: parseInt(quantity), quantity: parseInt(quantity), supplier, description, email, limit: 50 }
            const insert = await productCollection.insertOne(newInventory)
            if (insert) {
                res.status(200).send(insert)
            }




        })
        // get 1
        app.get(`/product/:id`, async (req, res) => {
            const { id } = req.params
            const filter = { _id: ObjectId(id) }
            const result = await productCollection.findOne(filter)
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(500).send({ message: 'server error' })
            }
        })
        // get 1
        app.get(`/product/:id`, async (req, res) => {
            const { id } = req.params
            const filter = { _id: ObjectId(id) }
            const result = await productCollection.findOne(filter)
            if (result) {
                res.status(200).send(result)
            } else {
                res.status(500).send({ message: 'server error' })
            }
        })
        // delete
        app.delete(`/product/:id`, async (req, res) => {
            const { id } = req.params
            const filter = { _id: ObjectId(id) }
            const itemDelete = await productCollection.deleteOne(filter)
            res.send(itemDelete)
        })
        // update quantity
        app.put(`/product/:id`, async (req, res) => {
            const { id } = req.params
            const quantity = req.body.updatedQuantity
            const filter = { _id: ObjectId(id) }
            const updatedQuantity = { $set: { quantity } }
            const itemUpdated = await productCollection.updateOne(filter, updatedQuantity)
            res.send(itemUpdated)
        })
        // jwt token
        app.post('/jwt-generator', async (req, res) => {
            const email = req.body.email
            const result = await userCollection.findOne({ email })
            console.log(result)
            const token = jwt.sign({ email, role: result.role || "user" }, process.env.TOKEN_SECRETE);
            res.send(token)
        })

        //===================================== user============================
        app.put(`/user`, async (req, res) => {

            const email = req.body.email

            const filter = { email }
            const updated = { $set: { email } }
            const itemUpdated = await userCollection.updateOne(filter, updated, { upsert: true })
            res.send(itemUpdated)
        })
        app.get(`/users`, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.delete(`/user/:id`, async (req, res) => {
            const id = req.params.id
            const result = await userCollection.deleteOne({ _id: ObjectId(id) })
            res.send(result)
        })
        // admin

        app.put(`/user/:id`, async (req, res) => {
            const updated = { $set: { role: "admin" } }
            const id = req.params.id
            const result = await userCollection.updateOne({ _id: ObjectId(id) }, updated, { upsert: true })
            res.send(result)
        })

        // ==================review=======================

        app.post('/review', async (req, res) => {

            const { review, userName, email } = req.body
            const newReview = { userName, review, email }
            const insert = await reviewCollection.insertOne(newReview)
            if (insert) {
                res.status(200).send(insert)
            }


        })

        app.get(`/review`, async (req, res) => {
            const limit = req.query.limit || 100
            const result = await reviewCollection.find().sort({ _id: -1 }).limit(parseInt(limit)).toArray()
            res.send(result)
        })
        // ==============order=================================

        app.get('/orders', async (req, res) => {

            const query = {}
            const cursor = orderCollection.find(query)
            const result = await cursor.toArray()
            res.status(200).send(result)

        })
        app.post('/orders', async (req, res) => {
            const result = await orderCollection.insertOne(req.body)
            res.send(result)

        })


        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id
            const query = {}
            const result = await orderCollection.deleteOne({ _id: ObjectId(id) })
            res.status(200).send(result)

        })












        // payment
        app.post('/payment-intent', async (req, res) => {
            const { price } = req.body
            if (price > 999999) {
                return res.status(501).send({ message: 'Amount must be no more than $999,999.99' })
            }
            const amount = parseFloat(price) * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: parseInt(amount),
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
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