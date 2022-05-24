

const express = require('express');

const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port  = process.env.PORT || 7000;

const app = express();
require("dotenv").config();

app.use(express.json());
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
      const productcollection = client.db("electro").collection("products");
      const ordercollection = client.db("order").collection("ordercollection");
      const userCollection = client.db("user").collection("userdata");
      const reviewcollection = client.db("review").collection("reviewdata");
      console.log("db is connected");

      const productdatacollectionforcustomer = client
        .db("electro")
        .collection("productdata");

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

      // reduce a single value

      app.put("/reduce/:id", async (req, res) => {
        const id = req.params.id;
        const updatedquantity = req.body;
        const newquantity = Number(updatedquantity.updatednumber);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            minimumorder: newquantity,
          },
        };
        const result = await productcollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        console.log(result);
        res.send(result);
      });

      // incresing quantity by one

      app.put("/increase/:id", async (req, res) => {
        const id = req.params.id;
        console.log(id);

        const increasedquantity = req.body;
        console.log(increasedquantity);
        const newquantity = increasedquantity.updatedquantity;

        console.log(newquantity);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            minimumorder: newquantity,
          },
        };
        const result = await productcollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        console.log(result);
        res.send(result);
      });

      // posting a order order
      app.post("/order", async (req, res) => {
        const newService = req.body;
        const result = await ordercollection.insertOne(newService);
        res.send(result);
      });

      // getting individual orders
      app.get("/myorder", async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const cursor = ordercollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      });

      // Deleting the order
      app.delete("/order/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = ordercollection.deleteOne(query);
        res.send(result);
      });

      // posting review
      // posting a order order
      app.post("/review", async (req, res) => {
        const newReview = req.body;
        const result = await reviewcollection.insertOne(newReview);
        res.send(result);
      });

      // putting userinfo
      // posting a order order
      app.post("/userInfo", async (req, res) => {
        const newUser = req.body;
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      });

   
    }
    finally{

    }

}
run().catch(console.dir);

app.listen(port , () => {
    console.log("server is running")
})