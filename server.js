import express from "express";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(express.json());

const API_KEY = "fKXmTzikuP24ES7wyJ95R3YCGhkLSc99";

/* =========================
   DATABASE (Render)
   ========================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* =========================
   INIT TABLE
   ========================= */
await pool.query(`
  CREATE TABLE IF NOT EXISTS blacklist (
    uuid TEXT PRIMARY KEY,
    reason TEXT NOT NULL
  );
`);

/* =========================
   AUTH MIDDLEWARE
   ========================= */
app.use((req, res, next) => {
  if (req.headers.authorization !== API_KEY) {
    return res.sendStatus(401);
  }
  next();
});

/* =========================
   ADD BAN
   ========================= */
app.post("/ban", async (req, res) => {
  const { uuid, reason } = req.body;
  if (!uuid) return res.status(400).send("UUID missing");

  await pool.query(
    "INSERT INTO blacklist (uuid, reason) VALUES ($1, $2) ON CONFLICT (uuid) DO UPDATE SET reason = $2",
    [uuid, reason || "No reason provided"]
  );

  res.sendStatus(200);
});

/* =========================
   REMOVE BAN
   ========================= */
app.delete("/ban/:uuid", async (req, res) => {
  await pool.query(
    "DELETE FROM blacklist WHERE uuid = $1",
    [req.params.uuid]
  );
  res.sendStatus(200);
});

/* =========================
   CHECK BAN
   ========================= */
app.get("/ban/:uuid", async (req, res) => {
  const result = await pool.query(
    "SELECT reason FROM blacklist WHERE uuid = $1",
    [req.params.uuid]
  );

  if (result.rowCount > 0) {
    res.status(200).json({ reason: result.rows[0].reason });
  } else {
    res.sendStatus(404);
  }
});

/* =========================
   START
   ========================= */
app.listen(3000, () => {
  console.log("Global Blacklist API running (PostgreSQL)");
});
