import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("PrepTrack backend running");
});

/**
 * Codeforces contests proxy
 */
app.get("/api/codeforces/contests", async (req, res) => {
  try {
    const response = await fetch(
      "https://codeforces.com/api/contest.list?gym=false"
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Codeforces data" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

app.get("/api/codeforces/user/:handle", async (req, res) => {
  const { handle } = req.params;

  try {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Codeforces user" });
  }
});