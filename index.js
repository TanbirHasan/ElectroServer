

const express = require('express');

const cors = require('cors');
var jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port  = process.env.PORT || 7000;

const app = express();


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
       const userCollectionFull = client.db("userColllectionFull").collection("userdata");
      const reviewcollection = client.db("review").collection("reviewdata");
      const paymentscollection = client
        .db("payments")
        .collection("paymentsdata");
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

      // stripe payment
      app.post("/create-payment-intent", verifyJWT, async (req, res) => {
        const service = req.body;
        const price = service.price;
        const amount = price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
      });

      // for single product
      app.get("/productdetails/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const product = await productcollection.findOne(query);
        res.send(product);
      });

      // post a data
      app.post("/newproduct", async (req, res) => {
        const newproduct = req.body;
        const result = await productcollection.insertOne(newproduct);
        res.send(result);
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

      // getting all orders

      app.get("/order", async (req, res) => {
        const query = {};
        const cursor = ordercollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      });
      // getting all reviews

      app.get("/review", async (req, res) => {
        const query = {};
        const cursor = reviewcollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
      });

      // getting individual orders
      app.get("/myorder", verifyJWT, async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const cursor = ordercollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      });

      // getting order for payment
      app.get("/order/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const order = await ordercollection.findOne(query);
        res.send(order);
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

      app.get("/userInfo", verifyJWT, async (req, res) => {
        const email = req.query.email;
      
        console.log("///");

        // const query = { email: email };
        // const cursor = userCollection.find(query);
        // const user = await cursor.toArray();
        // return res.send(user);

        const decodedEmail = req.decoded.email;
      

        if (email === decodedEmail) {
          const query = { email: email };
          const cursor = userCollectionFull.find(query);
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
      
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
         
            email: user.email,
         
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

      // storing users with full information


      app.put("/usersinfo/:email", async (req, res) => {
        const email = req.params.email;
        const userInfo = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            name: userInfo.name,
            email: userInfo.email,
            location: userInfo.location,
            phone: userInfo.phone,
            linkedin: userInfo.linkedin,
          },
        };
        const result = await userCollectionFull.updateOne(
          filter,
          updateDoc,
          options
        );
     
        res.send(result );
      });

      // getting all users

      app.get("/users", verifyJWT, async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      });

      // making an user to admin
      app.put("/users/admin/:email", verifyJWT, async (req, res) => {
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
      });
      // checking ig the user is a admin or not
      app.get("/admin/:email", verifyJWT, async (req, res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        const isAdmin = user.role === "admin";
        res.send({ admin: isAdmin });
      });

      app.patch("/order/:id", verifyJWT, async (req, res) => {
        const id = req.params.id;
        const payment = req.body;
        const filter = { _id: ObjectId(id) };
        const updatedDoc = {
          $set: {
            paid: true,
            transactionId: payment.transactionId,
          },
        };
        const result = await paymentscollection.insertOne(payment);
        const updateorder = await ordercollection.updateOne(filter, updatedDoc);

        res.send({ updateorder });
      });
    }
    finally{

    }

}
run().catch(console.dir);

app.listen(port , () => {
    console.log("server is running")
})