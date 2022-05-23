

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
        const ordercollection = client
          .db("order")
          .collection("ordercollection");
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
            console.log(newquantity)
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

          // getting order
            app.post("/order", async (req,res) => {
            const newService = req.body;
            const result = await ordercollection.insertOne(newService);
            res.send(result);
              })
    }
    finally{

    }

}
run().catch(console.dir);

app.listen(port , () => {
    console.log("server is running")
})