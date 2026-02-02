import { app } from "./firebase";

/**
 * Enable email notifications
 */
export async function enableNotifications(userEmail, userName, authToken) {
  try {
    // No more Notification.requestPermission() or Service Workers
    console.log("Enabling email notifications for:", userEmail);

    // Send email notification trigger to backend
    let emailSuccess = false;
    let emailError = null;
    try {
      const emailResponse = await fetch("http://localhost:5000/api/send-notification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ email: userEmail, name: userName })
      });

      if (emailResponse.ok) {
        console.log("✅ Notification email sent successfully");
        emailSuccess = true;
      } else {
        const errData = await emailResponse.json();
        emailError = errData.details || errData.error || "Server error";
        console.warn("⚠️ Failed to send notification email:", emailError);
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      emailError = "Connection failed";
    }

    // Return success since the preference is what matters most
    return { success: true, emailSuccess, emailError };
  } catch (error) {
    console.error("Error enabling notifications:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update notification preference in backend
 */
export async function updateNotificationPreference(enabled, authToken) {
  try {
    const response = await fetch("http://localhost:5000/api/update-notification-preference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ enabled })
    });

    if (response.ok) {
      console.log(`✅ Notification preference updated: ${enabled}`);
      return { success: true };
    } else {
      console.error("Failed to update notification preference");
      return { success: false };
    }
  } catch (error) {
    console.error("Error updating notification preference:", error);
    return { success: false, error: error.message };
  }
}
