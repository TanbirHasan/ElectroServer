

const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port  = process.env.PORT || 7000;

const app = express();
require("dotenv").config();

app.use(express());
app.use(cors());
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cs5ly.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


app.get("/" , (req,res) => {
    res.send("Hello, server is running")
}) 


async function run(){
    try{
          await client.connect();
          const productcollection = client
            .db("electro")
            .collection("products");
            console.log("db is connected");

            // getting all products

              app.get("/products", async (req, res) => {
                const query = {};
                const cursor = productcollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
              });

              // for single product
               app.get("/productdetails/:id", async (req, res) => {
                 const id = req.params.id;
                 const query = { _id: ObjectId(id) };
                 const product = await productcollection.findOne(query);
                 res.send(product);
               });


    }
    finally{

    }

}
run().catch(console.dir);

app.listen(port , () => {
    console.log("server is running")
})