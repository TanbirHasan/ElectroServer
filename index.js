

const express = require('express');

const cors = require('cors');
var jwt = require("jsonwebtoken");
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


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];


  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }

    req.decoded = decoded;
  
    next();
  });
}


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

        res.send(result);
      });

      // incresing quantity by one

      app.put("/increase/:id", async (req, res) => {
        const id = req.params.id;
      

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

        res.send(result);
      });

      // posting a order order
      app.post("/order", async (req, res) => {
        const newService = req.body;
        const result = await ordercollection.insertOne(newService);
        res.send(result);
      });

      // getting individual orders
      app.get("/myorder", verifyJWT, async (req, res) => {
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
      // app.post("/userInfo", async (req, res) => {
      //   const newUser = req.body;
      //   const result = await userCollection.insertOne(newUser);
      //   res.send(result);
      // });

      // getting user information

      app.get("/userInfo",verifyJWT, async (req, res) => {
        const email = req.query.email;
        console.log(email);
        console.log("///")
  


        // const query = { email: email };
        // const cursor = userCollection.find(query);
        // const user = await cursor.toArray();
        // return res.send(user);

        const decodedEmail = req.decoded.email;
        console.log(decodedEmail);

        if (email === decodedEmail) {
     
          const query = { email: email };
          const cursor = userCollection.find(query);
          const user = await cursor.toArray();
          return res.send(user);
        } else {
          return res.status(403).send({ message: "Forbidden Access" });
        }
      });

      // storing all user to the server
      app.put("/users/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const userInfo = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            name: userInfo.name,
            email: user.email || userInfo.email,
            location: userInfo.location,
            phone: userInfo.phone,
            linkedin: userInfo.linkedin,
          },
        };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign(
          { email: email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "2h",
          }
        );
        res.send({ result, token });
      });

      // getting all users

      app.get("/users", verifyJWT, async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      });

      // making an user to admin
      app.put("/users/admin/:email",verifyJWT, async (req,res) => {
        // const email = req.params.email;
        // const filter = {email:email}
        // const updatedDoc = {
        //   $set:{role:'admin'}
        // }
        // const result = await userCollection.updateOne(filter,updatedDoc)
        // res.send(result)

          const email = req.params.email;

          const requester = req.decoded.email;
          
          const requesterAccount = await userCollection.findOne({
            email: requester,
          });
          if (requesterAccount.role === "admin") {
            const filter = { email: email };

            const updateDoc = {
              $set: { role: "admin" },
            };
            const result = await userCollection.updateOne(filter, updateDoc);

            res.send(result);
          } else {
            res.status(401).send({ message: "forbidden" });
          }
                 
      })

   
    }
    finally{

    }

}
run().catch(console.dir);

app.listen(port , () => {
    console.log("server is running")
})