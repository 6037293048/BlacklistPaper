const express = require("express");
const app = express();

const API_KEY = "fKXmTzikuP24ES7wyJ95R3YCGhkLSc99";
const blacklist = new Map();

app.use(express.json());

app.use((req, res, next) => {
  if (req.headers.authorization !== API_KEY) {
    return res.sendStatus(401);
  }
  next();
});

app.post("/ban", (req, res) => {
  blacklist.set(req.body.uuid, req.body.reason);
  res.sendStatus(200);
});

app.get("/ban/:uuid", (req, res) => {
  if (!blacklist.has(req.params.uuid)) return res.sendStatus(404);
  res.json({ reason: blacklist.get(req.params.uuid) });
});

app.delete("/ban/:uuid", (req, res) => {
  blacklist.delete(req.params.uuid);
  res.sendStatus(200);
});

app.listen(3000, () => console.log("API läuft"));
