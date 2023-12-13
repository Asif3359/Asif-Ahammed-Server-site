const express = require("express");
const cors = require("cors");
const nodemailer = require('nodemailer');
require('dotenv').config();
const bodyParser = require('body-parser');
// require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ylhegt.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



async function run() {
    try {

        const ProjectCollection = client.db('AsifAhammed').collection('Projects');
        const MessageCollection = client.db('AsifAhammed').collection('messege');
        const userCollection = client.db('AsifAhammed').collection('user');


        app.get('/projects', async (req, res) => {
            const cursor = ProjectCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //get one  Project
        app.get('/projects/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ProjectCollection.findOne(query);
            res.send(result);
        });
        // nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MY_EMAIL, // replace with your Gmail address
                pass: process.env.MY_PASS, // replace with your Gmail password or use an app password
            },
        });
        // send Email 
        app.post('/submit', async (req, res) => {
            try {
                const { name, email, message } = req.body;

                // Save submission to MongoDB
                const result = await MessageCollection.insertOne({ name, email, message });

                // Send email
                await transporter.sendMail({
                    from: email, // replace with your Gmail address
                    to: 'asifahammednishst@gmail.com', // replace with the actual recipient email address
                    subject: 'New Contact Form Submission',
                    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
                });

                console.log('Email sent successfully');

                res.send(result);
            } catch (error) {
                console.error('Error processing submission:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("Asif Ahammed Server Is Running");
});


app.listen(port, () => {
    console.log(`Asif Ahammed Server Is Running :${port}`);
});