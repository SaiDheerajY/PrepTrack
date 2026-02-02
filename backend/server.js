import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { admin, db } from "./firebaseAdmin.js";
import { verifyToken } from "./authMiddleware.js";
import { sendNotificationWelcomeEmail, verifyEmailConfig } from "./emailService.js";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // Enable JSON body parsing

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("PrepTrack backend running");
});

/**
 * Send Notification Welcome Email (Protected)
 */
app.post("/api/send-notification-email", verifyToken, async (req, res) => {
  const { email, name } = req.body;
  const { uid } = req.user;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const result = await sendNotificationWelcomeEmail(email, name);

    if (result.success) {
      console.log(`✅ Notification email sent to ${email} for user ${uid}`);
      res.json({ success: true, message: "Email sent successfully" });
    } else {
      console.error(`❌ Failed to send email to ${email}:`, result.error);
      res.status(500).json({ error: "Failed to send email", details: result.error });
    }
  } catch (error) {
    console.error("Error in /api/send-notification-email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Update Notification Preference (Protected)
 */
app.post("/api/update-notification-preference", verifyToken, async (req, res) => {
  const { enabled } = req.body;
  const { uid } = req.user;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: "Missing or invalid 'enabled' field" });
  }

  try {
    if (!db) throw new Error("Database not initialized");

    await db.collection("users").doc(uid).update({
      notificationsEnabled: enabled,
      notificationUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Notification preference updated for user ${uid}: ${enabled}`);
    res.json({ success: true, enabled });
  } catch (error) {
    console.error("Error updating notification preference:", error);
    res.status(500).json({ error: "Failed to update preference" });
  }
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

/**
 * Codeforces user proxy
 */
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

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  // Verify email service configuration
  await verifyEmailConfig();
});