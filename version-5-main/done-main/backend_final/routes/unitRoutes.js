import express from "express";
import UnitMapping from "../models/UnitMapping.js";
import unitMappingService from "../services/unitMappingService.js";

const router = express.Router();

/**
 * GET /api/unit/mappings
 * Get all unit mappings
 */
router.get("/mappings", async (req, res) => {
  try {
    const mappings = await unitMappingService.getAllMappings();
    
    res.json({
      success: true,
      count: mappings.length,
      mappings,
    });
  } catch (err) {
    console.error("[Unit Routes] GET /mappings error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET /api/unit/unmapped-payers
 * Get payers that haven't been mapped to units
 * 
 * Query params:
 *   - limit: number of results (default: 20, max: 100)
 */
router.get("/unmapped-payers", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    
    const unmappedPayers = await unitMappingService.getUnmappedPayers(limit);
    
    res.json({
      success: true,
      count: unmappedPayers.length,
      unmappedPayers,
    });
  } catch (err) {
    console.error("[Unit Routes] GET /unmapped-payers error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET /api/unit/find/:payerName
 * Find unit mapping for a payer
 * Supports fuzzy matching
 * 
 * Query params:
 *   - vpa: optional VPA/UPI ID for more accurate matching
 */
router.get("/find/:payerName", async (req, res) => {
  try {
    const { payerName } = req.params;
    const { vpa } = req.query;
    
    const result = await unitMappingService.findUnitMapping(payerName, vpa);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[Unit Routes] GET /find/:payerName error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * POST /api/unit/mappings
 * Create or update a unit mapping
 * 
 * Body:
 * {
 *   unitId: "office-102",
 *   unitType: "office",
 *   unitNumber: "102",
 *   ownerNames: ["KAILASH MANGARAM DHANWANI", "kailash dhanwani"],
 *   vpaAliases: ["kailashdhanwani880@okaxis"],
 *   phoneNumbers: ["9876543210"],
 *   email: "kailash@example.com",
 *   notes: "Main office owner"
 * }
 */
router.post("/mappings", async (req, res) => {
  try {
    const { unitId, unitType, unitNumber, ownerNames, vpaAliases, phoneNumbers, email, notes } = req.body;
    
    // Validate required fields
    if (!unitId || !unitType) {
      return res.status(400).json({
        success: false,
        message: "unitId and unitType are required",
      });
    }
    
    const mappingData = {
      unitId,
      unitType,
      unitNumber,
      ownerNames: ownerNames || [],
      vpaAliases: vpaAliases || [],
      phoneNumbers: phoneNumbers || [],
      email,
      notes,
    };
    
    const result = await unitMappingService.createOrUpdateMapping(mappingData);
    
    res.json({
      success: true,
      mapping: result,
    });
  } catch (err) {
    console.error("[Unit Routes] POST /mappings error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * PUT /api/unit/mappings/:unitId
 * Update an existing unit mapping
 */
router.put("/mappings/:unitId", async (req, res) => {
  try {
    const { unitId } = req.params;
    const updateData = req.body;
    
    // Don't allow changing unitId
    delete updateData.unitId;
    
    const result = await unitMappingService.createOrUpdateMapping({
      unitId,
      ...updateData,
    });
    
    res.json({
      success: true,
      mapping: result,
    });
  } catch (err) {
    console.error("[Unit Routes] PUT /mappings/:unitId error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * DELETE /api/unit/mappings/:unitId
 * Delete a unit mapping (soft delete - set status to inactive)
 */
router.delete("/mappings/:unitId", async (req, res) => {
  try {
    const { unitId } = req.params;
    
    const result = await UnitMapping.findOneAndUpdate(
      { unitId },
      { status: "inactive" },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Unit mapping not found",
      });
    }
    
    res.json({
      success: true,
      message: "Unit mapping deactivated",
      mapping: result,
    });
  } catch (err) {
    console.error("[Unit Routes] DELETE /mappings/:unitId error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * POST /api/unit/seed
 * Seed unit mappings from array (useful for initial setup)
 * 
 * Body:
 * [
 *   {
 *     unitId: "office-102",
 *     unitType: "office",
 *     unitNumber: "102",
 *     ownerNames: ["KAILASH MANGARAM DHANWANI"],
 *     vpaAliases: ["kailashdhanwani880@okaxis"]
 *   },
 *   ...
 * ]
 */
router.post("/seed", async (req, res) => {
  try {
    const mappingsArray = req.body;
    
    if (!Array.isArray(mappingsArray)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of mappings",
      });
    }
    
    const results = await unitMappingService.seedMappings(mappingsArray);
    
    res.json({
      success: true,
      seeded: results.length,
      mappings: results,
    });
  } catch (err) {
    console.error("[Unit Routes] POST /seed error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;

