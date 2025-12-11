import Maintenance from "../models/Maintenance.js";
import SinkingFund from "../models/SinkingFund.js";
import Interest from "../models/Interest.js";
import BankTransaction from "../models/BankTransaction.js";

/**
 * Smart Payment Distribution Service
 * Handles:
 * 1. Multiple units per owner (splits payment)
 * 2. Sinking fund deduction (one-time payment)
 * 3. Interest tracking (extra amounts)
 */

// Get all units owned by a person
async function getOwnerUnits(ownerName) {
  try {
    const searchName = ownerName.toLowerCase().trim();
    const units = await Maintenance.find({});
    
    const ownerUnits = [];
    
    for (const unit of units) {
      const ownerNames = (unit.owner || "").toLowerCase();
      
      // Check if owner name matches
      if (ownerNames.includes(searchName) || searchName.includes(ownerNames.split('\n')[0])) {
        ownerUnits.push({
          flat: unit.unit?.match(/(\d+)/)?.[1] || unit.unit,
          type: unit.type || "office",
          owner: unit.owner,
          maintenanceDue: unit.type === "shop" ? 1500 : 2000
        });
      }
    }
    
    return ownerUnits;
  } catch (err) {
    console.error("Error getting owner units:", err);
    return [];
  }
}

// Get sinking fund status for a unit
async function getSinkingFundStatus(flat) {
  try {
    const sinking = await SinkingFund.findOne({ unit: flat });
    if (!sinking) return { paid: false, pending: 0 };
    
    const isPaid = sinking.paid === "Paid" || sinking.paid === "paid";
    const pending = parseFloat(sinking.pending) || 0;
    
    return { paid: isPaid, pending };
  } catch (err) {
    console.error("Error getting sinking fund status:", err);
    return { paid: false, pending: 0 };
  }
}

// Update sinking fund status
async function updateSinkingFund(flat, amountPaid) {
  try {
    await SinkingFund.updateOne(
      { unit: flat },
      { 
        $set: { 
          paid: "Paid",
          pending: 0 
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Sinking fund marked paid for unit ${flat}: ₹${amountPaid}`);
  } catch (err) {
    console.error("Error updating sinking fund:", err);
  }
}

// Save interest payment
async function saveInterest(flat, ownerName, amount, monthYear, transactionId) {
  try {
    const interest = new Interest({
      flat,
      ownerName,
      amount,
      monthYear,
      transactionId,
      description: "Extra payment - Interest"
    });
    
    await interest.save();
    console.log(`💰 Interest saved for ${ownerName} (${flat}): ₹${amount}`);
  } catch (err) {
    console.error("Error saving interest:", err);
  }
}

/**
 * Process a payment transaction intelligently
 * @param {Object} transaction - Original bank transaction
 * @returns {Array} - Array of processed transactions (split if multiple units)
 */
export async function processPayment(transaction) {
  try {
    if (transaction.type !== "credit") {
      // Only process credit (incoming) transactions
      return [transaction];
    }

    const { amount, name, flat, date } = transaction;
    const monthYear = new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Get all units owned by this person
    const ownerUnits = await getOwnerUnits(name);
    
    if (ownerUnits.length === 0) {
      // No units found, return original transaction
      return [transaction];
    }
    
    if (ownerUnits.length === 1) {
      // Single unit - process normally with sinking fund check
      const unit = ownerUnits[0];
      const sinkingStatus = await getSinkingFundStatus(unit.flat);
      
      let remainingAmount = amount;
      let maintenanceAmount = 0;
      let sinkingAmount = 0;
      let interestAmount = 0;
      
      // Check if sinking fund needs to be paid
      if (!sinkingStatus.paid) {
        const sinkingDue = unit.type === "shop" ? 1500 : 2000;
        sinkingAmount = Math.min(remainingAmount, sinkingDue);
        remainingAmount -= sinkingAmount;
        
        if (sinkingAmount === sinkingDue) {
          await updateSinkingFund(unit.flat, sinkingAmount);
        }
      }
      
      // Deduct maintenance
      maintenanceAmount = Math.min(remainingAmount, unit.maintenanceDue);
      remainingAmount -= maintenanceAmount;
      
      // Any remaining is interest
      if (remainingAmount > 0) {
        interestAmount = remainingAmount;
        await saveInterest(unit.flat, name, interestAmount, monthYear, transaction.messageId || transaction.reference_no);
      }
      
      console.log(`📊 Payment breakdown for ${name} (${unit.flat}):
        Total: ₹${amount}
        Sinking: ₹${sinkingAmount}
        Maintenance: ₹${maintenanceAmount}
        Interest: ₹${interestAmount}`);
      
      return [{
        ...transaction,
        flat: unit.flat,
        amount: maintenanceAmount,
        sinkingFund: sinkingAmount,
        interest: interestAmount
      }];
    }
    
    // Multiple units - split payment equally
    const amountPerUnit = amount / ownerUnits.length;
    const processedTransactions = [];
    
    for (const unit of ownerUnits) {
      let remainingAmount = amountPerUnit;
      let maintenanceAmount = 0;
      let sinkingAmount = 0;
      let interestAmount = 0;
      
      const sinkingStatus = await getSinkingFundStatus(unit.flat);
      
      // Check sinking fund
      if (!sinkingStatus.paid) {
        const sinkingDue = unit.type === "shop" ? 1500 : 2000;
        sinkingAmount = Math.min(remainingAmount, sinkingDue);
        remainingAmount -= sinkingAmount;
        
        if (sinkingAmount === sinkingDue) {
          await updateSinkingFund(unit.flat, sinkingAmount);
        }
      }
      
      // Deduct maintenance
      maintenanceAmount = Math.min(remainingAmount, unit.maintenanceDue);
      remainingAmount -= maintenanceAmount;
      
      // Interest
      if (remainingAmount > 0) {
        interestAmount = remainingAmount;
        await saveInterest(unit.flat, name, interestAmount, monthYear, transaction.messageId || transaction.reference_no);
      }
      
      console.log(`📊 Payment split for ${name} (${unit.flat}):
        Share: ₹${amountPerUnit}
        Sinking: ₹${sinkingAmount}
        Maintenance: ₹${maintenanceAmount}
        Interest: ₹${interestAmount}`);
      
      processedTransactions.push({
        ...transaction,
        flat: unit.flat,
        amount: maintenanceAmount,
        sinkingFund: sinkingAmount,
        interest: interestAmount
      });
    }
    
    return processedTransactions;
    
  } catch (err) {
    console.error("Error processing payment:", err);
    return [transaction];
  }
}

// Get total interest for dashboard
export async function getTotalInterest(year) {
  try {
    const yearStr = year || new Date().getFullYear();
    const interests = await Interest.find({
      monthYear: new RegExp(yearStr)
    });
    
    const total = interests.reduce((sum, i) => sum + i.amount, 0);
    return { total, count: interests.length, interests };
  } catch (err) {
    console.error("Error getting total interest:", err);
    return { total: 0, count: 0, interests: [] };
  }
}

export default { processPayment, getTotalInterest };
