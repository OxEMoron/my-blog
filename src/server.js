import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')))
app.use(bodyParser.json());

//app.get('/hello', (req, res) => res.send('Hello!'));
//app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}!!`) )
//app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}!!`));

const withDB = async (res, operations) => {
  try {
    const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = client.db("my-blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db.", error });
  }
}

app.get("/api/articles/:name", async (req, res) => {
  const name = req.params.name;
  withDB(res, async (db) => {
    const articleInfo = await db.collection("articles").findOne({ name });
    res.status(200).json(articleInfo);
  });
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  const name = req.params.name;

  withDB(res, async (db) => {
    const articleInfo = await db.collection("articles").findOne({ name });
    await db
      .collection("articles")
      .updateOne({ name }, { $set: { upvotes: articleInfo.upvotes + 1 } });
    const articleUpdate = await db.collection("articles").findOne({ name });
    res.status(200).json(articleUpdate);
  });
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const name = req.params.name;

  withDB(res, async (db) => {
    const articleInfo = await db.collection("articles").findOne({ name });
    await db
      .collection("articles")
      .updateOne({ name }, { $set: { comments: articleInfo.comments.concat({ username, text }) }});
    const articleUpdate = await db.collection("articles").findOne({ name });
    res.status(200).json(articleUpdate);
  });
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname + '/build/index.html'))});

app.listen(8000, () => console.log("Listening on port 8000"));

// "lkJ-987BNM"  lkJ-987BNM
