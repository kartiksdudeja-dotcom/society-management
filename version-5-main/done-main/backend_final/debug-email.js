import { getGmailService } from "./services/gmailHelper.js";

async function debugEmail(messageId) {
  const gmail = getGmailService();
  
  try {
    const fullEmail = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    let body = "";
    const payload = fullEmail.data.payload;

    // Handle different email structures
    if (payload.parts) {
      // Multipart email
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
          if (part.body.data) {
            body = Buffer.from(part.body.data, "base64").toString("utf-8");
            break;
          }
        }
      }
    } else if (payload.body && payload.body.data) {
      // Simple email
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    const headers = payload.headers;
    const subject = headers.find(h => h.name === "Subject")?.value || "";
    const from = headers.find(h => h.name === "From")?.value || "";

    console.log("\n==========================================");
    console.log(`Message ID: ${messageId}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${from}`);
    console.log("==========================================");
    console.log(body);
    console.log("==========================================\n");

  } catch (err) {
    console.error(`Error fetching email: ${err.message}`);
  }
}

// Fetch the two failing emails
debugEmail("19a3ac76").then(() => debugEmail("19a3974a"));
