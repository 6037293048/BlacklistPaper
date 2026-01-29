import express from "express";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(express.json());

/* =========================
   CONFIG
   ========================= */
const API_KEY = "fKXmTzikuP24ES7wyJ95R3YCGhkLSc99";
const PORT = process.env.PORT || 3000;

/* =========================
   DATABASE (RENDER)
   ========================= */
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

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

console.log("Blacklist table ready");

/* =========================
   AUTH MIDDLEWARE
   ========================= */
app.use((req, res, next) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).send("Unauthorized");
  }
  next();
});

/* =========================
   ADD TO BLACKLIST
   ========================= */
app.post("/ban", async (req, res) => {
  const { uuid, reason } = req.body;
  if (!uuid) return res.status(400).send("UUID missing");

  await pool.query(
    `INSERT INTO blacklist (uuid, reason)
     VALUES ($1, $2)
     ON CONFLICT (uuid)
     DO UPDATE SET reason = $2`,
    [uuid, reason || "Blacklisted"]
  );

  res.sendStatus(200);
});

/* =========================
   REMOVE BLACKLIST
   ========================= */
app.delete("/ban/:uuid", async (req, res) => {
  await pool.query(
    "DELETE FROM blacklist WHERE uuid = $1",
    [req.params.uuid]
  );
  res.sendStatus(200);
});

/* =========================
   CHECK BLACKLIST
   ========================= */
app.get("/ban/:uuid", async (req, res) => {
  const result = await pool.query(
    "SELECT reason FROM blacklist WHERE uuid = $1",
    [req.params.uuid]
  );

  if (result.rowCount === 0) {
    return res.sendStatus(404);
  }

  res.json({ reason: result.rows[0].reason });
});

/* =========================
   START SERVER
   ========================= */
app.listen(PORT, () => {
  console.log("Blacklist API running on port " + PORT);
});
