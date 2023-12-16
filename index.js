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
        const ReplayCollection = client.db('AsifAhammed').collection('replay');
        const userCollection = client.db('AsifAhammed').collection('user');
        const questionCollection = client.db('AsifAhammed').collection('question');


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
        app.get('/message', async (req, res) => {
            const cursor = MessageCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/question', async (req, res) => {
            const cursor = questionCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/replay', async (req, res) => {
            const cursor = ReplayCollection.find();
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
        //get one  Project
        app.get('/message/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await MessageCollection.findOne(query);
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
                const { name, email, message, selectStatus, replayStatus } = req.body;

                // Save submission to MongoDB
                const result = await MessageCollection.insertOne({ name, email, message, selectStatus, replayStatus });

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
        // send Email 
        app.post('/replay', async (req, res) => {
            try {
                const { email, subject, message, submitEmail } = req.body;

                // Save submission to MongoDB
                const myEmail = 'asifahammednishst@gmail.com'
                const result = await ReplayCollection.insertOne({ subject, email, message, submitEmail, myEmail });

                // Send email
                await transporter.sendMail({
                    from: 'asifahammednishst@gmail.com', // replace with your Gmail address
                    to: email, // replace with the actual recipient email address
                    subject: subject,
                    html: `
                            <html>
                                <head>
                                    <style>
                                        body {
                                            font-family: 'Arial', sans-serif;
                                        }
                                        .email-container {
                                            max-width: 600px;
                                            margin: 0 auto;
                                            padding: 20px;
                                            background-color: #f4f4f4;
                                            border-radius: 8px;
                                        }
                                        .email-header {
                                            font-size: 18px;
                                            font-weight: bold;
                                            color: #333;
                                            margin-bottom: 10px;
                                        }
                                        .email-content {
                                            font-size: 16px;
                                            color: #555;
                                            line-height: 1.6;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="email-container">
                                        <div class="email-header">Subject: ${subject}</div>
                                        <div class="email-content">
                                            <p>Email: asifahammednishst@gmail.com</p>
                                            <p>Message: ${message}</p>
                                        </div>
                                    </div>
                                </body>
                            </html>
                        `,
                });

                console.log('Email sent successfully');

                res.send({ message: 'Email Send Successfully' });
            } catch (error) {
                console.error('Error processing submission:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
        // update 
        app.patch('/updateStatus/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const updatedReplay = await ReplayCollection.findOneAndUpdate(
                    { _id: new ObjectId(id) }, // Assuming your id is a valid ObjectId
                    { $set: { selectStatus: true } },
                    { returnDocument: 'after' } // To get the updated document
                );

                res.json(updatedReplay.value);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // question
        app.post('/question', async (req, res) => {
            const question = req.body;

            const query = { selectId: question.selectId }
            const existSelect = await questionCollection.findOne(query);
            if (existSelect) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await questionCollection.insertOne(question);
            res.send(result);
        });


        app.delete('/messages/:id', async (req, res) => {
            try {

                const result = await MessageCollection.deleteOne({ _id: new ObjectId(req.params.id) });

                if (result.deletedCount === 1) {
                    res.status(200).json({ message: 'Message deleted successfully' });
                } else {
                    res.status(404).json({ message: 'Message not found' });
                }

            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
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