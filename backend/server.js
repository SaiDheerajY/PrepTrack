import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { admin, db } from "./firebaseAdmin.js";
import { verifyToken } from "./authMiddleware.js";
import { sendNotificationWelcomeEmail, sendStreakReminder, verifyEmailConfig } from "./emailService.js";

dotenv.config();

// -- CRON JOB: Check Streaks daily at 8:00 PM --
cron.schedule('0 20 * * *', async () => {
  console.log('⏰ Running Daily Streak Check (8:00 PM)...');

  try {
    const usersSnapshot = await db.collection('users').where('notificationsEnabled', '==', true).get();
    const today = new Date().toDateString();

    usersSnapshot.forEach(async (doc) => {
      const userData = doc.data();
      const lastActive = userData.lastActiveDate; // "Mon Jan 01 2024" format

      if (lastActive !== today) {
        console.log(`⚠️ User ${userData.email} is inactive today. Sending reminder...`);
        await sendStreakReminder(userData.email, userData.displayName || "User");
      }
    });
  } catch (error) {
    console.error('❌ Error in Streak Cron Job:', error);
  }
});

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

/**
 * AI Summary via Groq (Protected)
 */
app.post("/api/ai-summary", verifyToken, async (req, res) => {
  const { view, totalTasks, totalVideos, activeDays, totalDays, streak, bestDay, topTasks, topVideos } = req.body;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "YOUR_GROQ_API_KEY_HERE") {
    return res.status(500).json({ error: "Groq API key not configured" });
  }

  const prompt = `You are an AI coach for a competitive programming student tracker app called PrepTrack. Analyze the following ${view} stats and give a short, motivational, data-driven summary (max 150 words). Use a direct, slightly hacker/terminal tone. Include specific observations and actionable tips.

Stats:
- Tasks Completed: ${totalTasks}
- Videos Watched: ${totalVideos}
- Active Days: ${activeDays}/${totalDays}
- Current Streak: ${streak} days
- Most Productive Day: ${bestDay}
- Top Tasks: ${topTasks?.join(", ") || "None"}
- Top Videos: ${topVideos?.join(", ") || "None"}

Give insights on consistency, areas of improvement, and encouragement. Format with line breaks for readability.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      res.json({ insight: data.choices[0].message.content });
    } else {
      console.error("Groq response error:", data);
      res.status(500).json({ error: "AI generation failed", details: data.error?.message || "Unknown error" });
    }
  } catch (error) {
    console.error("Groq API error:", error);
    res.status(500).json({ error: "AI generation failed", details: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  // Verify email service configuration
  await verifyEmailConfig();
});