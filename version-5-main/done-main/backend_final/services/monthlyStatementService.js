import LearnedMapping from "../models/LearnedMapping.js";
import Maintenance from "../models/Maintenance.js";

function clean(x) {
  return (x || "").replace(/\s+/g, " ").trim();
}

// Extract VPA from narration
function extractVPA(narration) {
  if (!narration) return null;
  const vpa = narration.match(/vpa\s+([a-z0-9._-]+@[a-z0-9]+)/i);
  return vpa ? vpa[1].toLowerCase() : null;
}

// Extract name from narration (capital letters after VPA or from NEFT)
function extractName(narration) {
  if (!narration) return null;

  // For NEFT transactions: extract name between IFSC and "Icon tower"
  // Format: NEFT Cr-ICIC0SF0002-HARISH SHAMLAL TEJWANI-Icon tower
  const neftMatch = narration.match(/NEFT\s+Cr-[A-Z0-9]+-([A-Z\s]+)-Icon\s+tower/i);
  if (neftMatch) {
    return neftMatch[1].trim();
  }

  // For UPI transactions: get the capital letters block after VPA
  const caps = narration.match(/[A-Z][A-Z ]{4,}/);
  if (caps) return caps[0].trim();

  return null;
}

// Extract unit number from unit string like "office - 103" or "office -302"
function extractUnitNumber(unitStr) {
  if (!unitStr) return null;
  const match = unitStr.match(/(\d+)/);
  return match ? match[1] : null;
}

// Get primary owner name (first name if multiple)
function getPrimaryOwner(ownerStr) {
  if (!ownerStr) return null;
  // Split by newline and get first owner
  const owners = ownerStr.split('\n').map(o => o.trim()).filter(o => o);
  return owners[0] || ownerStr;
}

// Match with Maintenance collection (member list) by name
async function matchWithMaintenance(extractedName) {
  if (!extractedName) return null;

  try {
    const searchName = extractedName.toLowerCase().trim();
    
    // Get all maintenance records
    const members = await Maintenance.find({});
    
    for (const member of members) {
      const ownerNames = (member.owner || "").toLowerCase();
      const unitNum = extractUnitNumber(member.unit);
      
      // Check if extracted name matches any part of owner name
      const ownerParts = ownerNames.split(/[\n,]/).map(n => n.trim()).filter(n => n);
      
      for (const ownerPart of ownerParts) {
        // Full match
        if (ownerPart === searchName) {
          return {
            ownerName: getPrimaryOwner(member.owner),
            officeNumber: unitNum,
            officeType: member.type || "office"
          };
        }
        
        // Partial match (at least 2 words matching)
        const searchWords = searchName.split(' ').filter(w => w.length > 2);
        const ownerWords = ownerPart.split(' ').filter(w => w.length > 2);
        
        let matchCount = 0;
        for (const sw of searchWords) {
          for (const ow of ownerWords) {
            if (sw === ow || sw.includes(ow) || ow.includes(sw)) {
              matchCount++;
            }
          }
        }
        
        // If at least 2 words match, consider it a match
        if (matchCount >= 2) {
          return {
            ownerName: getPrimaryOwner(member.owner),
            officeNumber: unitNum,
            officeType: member.type || "office"
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error("Error matching with Maintenance:", err.message);
    return null;
  }
}

// Match with LearnedMapping collection
async function matchWithLearnedMapping(extractedName) {
  if (!extractedName) return null;

  try {
    const searchKey = extractedName.toLowerCase().trim();
    
    // Strategy 1: Exact key match
    let mapping = await LearnedMapping.findOne({ key: searchKey });
    if (mapping) return mapping;

    // Strategy 2: Partial match - check if key is contained in extracted name
    const allMappings = await LearnedMapping.find({});
    for (const m of allMappings) {
      if (searchKey.includes(m.key) || m.key.includes(searchKey)) {
        return m;
      }
      // Also check examples array
      for (const example of m.examples || []) {
        if (searchKey.includes(example.toLowerCase()) || 
            example.toLowerCase().includes(searchKey)) {
          return m;
        }
      }
    }

    return null;
  } catch (err) {
    console.error("Error matching with LearnedMapping:", err.message);
    return null;
  }
}

async function parseTransaction(snippet) {
  if (!snippet) return null;

  let text = clean(snippet);
  const lower = text.toLowerCase();

  // Detect transaction type - process BOTH credit and debit
  const isCredited = lower.includes("credited");
  const isDebited = lower.includes("debited");

  // Skip if neither credit nor debit
  if (!isCredited && !isDebited) return null;

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

  // Extract VPA and Name from bank narration
  const vpa = extractVPA(text);
  const extractedName = extractName(text);

  // Match with LearnedMapping first, then Maintenance collection
  let mapping = null;
  let maintenanceMatch = null;
  
  if (isCredited) {
    // First try LearnedMapping (trained mappings)
    mapping = await matchWithLearnedMapping(extractedName);
    
    // If not found in LearnedMapping, try Maintenance (member list)
    if (!mapping) {
      maintenanceMatch = await matchWithMaintenance(extractedName);
    }
  }

  // Determine type
  const type = isCredited ? "credit" : "debit";

  // Use LearnedMapping if found, else use Maintenance match
  if (mapping) {
    return {
      date,
      amount,
      type,
      narration: text.substring(0, 300),
      vpa: vpa || null,
      name: mapping.ownerName || mapping.key || extractedName || null,
      payerName: mapping.payerName || extractedName || null,
      relationship: mapping.relationship || "self",
      flat: mapping.officeNumber || null,
    };
  } else if (maintenanceMatch) {
    return {
      date,
      amount,
      type,
      narration: text.substring(0, 300),
      vpa: vpa || null,
      name: maintenanceMatch.ownerName || extractedName || null,
      payerName: extractedName || null,
      relationship: "self",
      flat: maintenanceMatch.officeNumber || null,
    };
  } else {
    return {
      date,
      amount,
      type,
      narration: text.substring(0, 300),
      vpa: vpa || null,
      name: extractedName || null,
      payerName: extractedName || null,
      relationship: "self",
      flat: null,
    };
  }
}

export default { parseTransaction };
