import UnitMapping from "../models/UnitMapping.js";
import BankTransaction from "../models/BankTransaction.js";

/**
 * Levenshtein distance for fuzzy matching
 * Calculates similarity between two strings (0 = identical, higher = less similar)
 */
function levenshteinDistance(s1, s2) {
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Calculate similarity score (0-1, where 1 is identical)
 */
function getSimilarityScore(s1, s2) {
  const distance = levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Find unit mapping for a payer
 * Uses multi-strategy matching: exact -> VPA -> case-insensitive -> fuzzy
 * 
 * @param {string} payerName - Name extracted from transaction
 * @param {string} vpa - VPA/UPI ID if available
 * @returns {Object} { mapping, confidence, strategy }
 */
export const findUnitMapping = async (payerName, vpa = null) => {
  if (!payerName || typeof payerName !== "string") {
    return { mapping: null, confidence: 0, strategy: "no-input" };
  }

  const payerNameTrim = payerName.trim();
  const vpaTrim = vpa ? vpa.toLowerCase().trim() : null;

  try {
    // ============================================
    // Strategy 1: EXACT VPA MATCH (highest confidence)
    // ============================================
    if (vpaTrim) {
      const vpaMatch = await UnitMapping.findOne({
        vpaAliases: vpaTrim,
        status: "active",
      });

      if (vpaMatch) {
        return {
          mapping: vpaMatch,
          confidence: 0.99,
          strategy: "vpa-exact",
        };
      }
    }

    // ============================================
    // Strategy 2: EXACT NAME MATCH (case-sensitive)
    // ============================================
    const exactMatch = await UnitMapping.findOne({
      ownerNames: payerNameTrim,
      status: "active",
    });

    if (exactMatch) {
      return {
        mapping: exactMatch,
        confidence: 0.98,
        strategy: "name-exact",
      };
    }

    // ============================================
    // Strategy 3: CASE-INSENSITIVE MATCH
    // ============================================
    const caseInsensitiveMatch = await UnitMapping.findOne({
      ownerNames: new RegExp(`^${payerNameTrim}$`, "i"),
      status: "active",
    });

    if (caseInsensitiveMatch) {
      return {
        mapping: caseInsensitiveMatch,
        confidence: 0.95,
        strategy: "name-case-insensitive",
      };
    }

    // ============================================
    // Strategy 4: SUBSTRING MATCH
    // ============================================
    const allMappings = await UnitMapping.find({ status: "active" });

    // Check if payer name contains or is contained in any owner name
    for (const mapping of allMappings) {
      for (const ownerName of mapping.ownerNames) {
        if (
          payerNameTrim.toLowerCase().includes(ownerName.toLowerCase()) ||
          ownerName.toLowerCase().includes(payerNameTrim.toLowerCase())
        ) {
          return {
            mapping: mapping,
            confidence: 0.85,
            strategy: "name-substring",
          };
        }
      }
    }

    // ============================================
    // Strategy 5: FUZZY MATCH (Levenshtein distance)
    // ============================================
    let bestMatch = null;
    let bestScore = 0.75; // Minimum threshold for fuzzy match

    for (const mapping of allMappings) {
      for (const ownerName of mapping.ownerNames) {
        const score = getSimilarityScore(payerNameTrim, ownerName);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = mapping;
        }
      }
    }

    if (bestMatch) {
      return {
        mapping: bestMatch,
        confidence: Math.round(bestScore * 100) / 100,
        strategy: "fuzzy",
      };
    }

    // ============================================
    // No match found
    // ============================================
    return {
      mapping: null,
      confidence: 0,
      strategy: "no-match",
    };
  } catch (err) {
    console.error("Error finding unit mapping:", err);
    return { mapping: null, confidence: 0, strategy: "error" };
  }
};

/**
 * Create or update unit mapping
 * @param {Object} data - { unitId, unitType, ownerNames, vpaAliases, notes, etc. }
 */
export const createOrUpdateMapping = async (data) => {
  try {
    const { unitId, ...updateData } = data;

    const mapping = await UnitMapping.findOneAndUpdate(
      { unitId },
      {
        ...updateData,
        mappingConfidence: "manual",
        lastMappedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return mapping;
  } catch (err) {
    console.error("Error creating/updating unit mapping:", err);
    throw err;
  }
};

/**
 * Get all active mappings
 */
export const getAllMappings = async (status = "active") => {
  try {
    const mappings = await UnitMapping.find({ status }).sort({ unitId: 1 });
    return mappings;
  } catch (err) {
    console.error("Error fetching mappings:", err);
    throw err;
  }
};

/**
 * Get pending/unmapped transactions
 * Returns payer names that haven't been mapped yet
 */
export const getUnmappedPayers = async (limit = 20) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
          vpa: { $first: "$vpa" },
          latestDate: { $max: "$date" },
        },
      },
      { $sort: { latestDate: -1 } },
      { $limit: limit },
    ];

    const result = await BankTransaction.collection.aggregate(pipeline).toArray();

    // Filter out names that are already mapped
    const unmapped = [];

    for (const payer of result) {
      const mapping = await findUnitMapping(payer._id, payer.vpa);
      if (!mapping.mapping || mapping.strategy === "no-match") {
        unmapped.push({
          payerName: payer._id,
          vpa: payer.vpa,
          count: payer.count,
          latestDate: payer.latestDate,
          suggestedUnitId: null,
        });
      }
    }

    return unmapped;
  } catch (err) {
    console.error("Error fetching unmapped payers:", err);
    throw err;
  }
};

/**
 * Seed default mappings from array
 * Useful for initializing the database
 * @param {Array} mappingsArray - Array of mapping objects
 */
export const seedMappings = async (mappingsArray) => {
  try {
    const results = [];
    for (const mapping of mappingsArray) {
      const result = await createOrUpdateMapping({
        ...mapping,
        mappingConfidence: "manual",
      });
      results.push(result);
    }
    console.log(`[UnitMapping] Seeded ${results.length} mappings`);
    return results;
  } catch (err) {
    console.error("Error seeding mappings:", err);
    throw err;
  }
};

export default {
  findUnitMapping,
  createOrUpdateMapping,
  getAllMappings,
  getUnmappedPayers,
  seedMappings,
};
