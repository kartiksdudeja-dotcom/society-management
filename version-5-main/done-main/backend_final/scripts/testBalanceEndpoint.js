import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function testBalanceEndpoint() {
  try {
    console.log("🔄 Testing balance endpoint...\n");

    const response = await axios.get(`${BASE_URL}/bank/balance`);

    console.log("✅ API Response:\n");
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.ok && response.data.data) {
      console.log("\n💰 Balance Card Should Display:");
      console.log(`   Balance: ₹${response.data.data.balance.toLocaleString('en-IN')}`);
      console.log(`   Account: ...${response.data.data.accountEnding}`);
      console.log(`   Date: ${new Date(response.data.data.balanceDate).toLocaleDateString('en-IN')}`);
      console.log(`   Bank: ${response.data.data.bank}\n`);
      console.log("✅ API is working correctly!");
    } else {
      console.log("\n⏭️  No balance data available");
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error("   Server is not running. Start with: npm start");
    }
  }
}

testBalanceEndpoint();
