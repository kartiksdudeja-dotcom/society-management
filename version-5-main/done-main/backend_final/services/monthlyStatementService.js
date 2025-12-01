import User from "../models/User.js";

function clean(x) {
  return (x || "").replace(/\s+/g, " ").trim();
}

// Extract name from narration
function detectName(narration) {
  if (!narration) return null;

  // VPA Name
  const vpa = narration.match(/vpa\s+([a-z0-9._-]+)@/i);
  if (vpa) return vpa[1];

  // Capital letters block
  const caps = narration.match(/[A-Z][A-Z ]{4,}/);
  if (caps) return caps[0].trim();

  return null;
}

async function matchMember(extractedName) {
  const users = await User.find({});

  if (!extractedName) return null;

  const lower = extractedName.toLowerCase();

  return users.find((u) =>
    (u.name || "").toLowerCase().includes(lower)
  );
}

async function parseTransaction(snippet) {
  if (!snippet) return null;

  let text = clean(snippet);
  const lower = text.toLowerCase();

  if (!lower.includes("credited")) return null;

  // Amount
  const amt =
    text.match(/rs\.?\s?([\d,]+\.?\d*)/i) ||
    text.match(/inr\s?([\d,]+\.?\d*)/i);

  if (!amt) return null;

  const amount = Number(amt[1].replace(/,/g, ""));

  // Date
  const dateMatch = text.match(/on (\d{2})-(\d{2})-(\d{2})/i);
  let date = new Date();
  if (dateMatch) {
    date = new Date(`20${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00`);
  }

  // Detect name from narration
  const extractedName = detectName(text);

  // Match with USERS database
  const member = await matchMember(extractedName);

  return {
    date,
    amount,
    narration: text.substring(0, 300),
    name: member?.name || extractedName || null,
    flat: member?.FlatNumber || null,  // 🔥 ONLY FROM USER MODEL
  };
}

export default { parseTransaction };
