// Script to update Kartik Dudeja's role to manager
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection - use the correct connection string from .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://kartikdudeja_one:KARTIK12345@cluster0.gwswykf.mongodb.net/';

async function updateKartikRole() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI prefix:', MONGODB_URI.substring(0, 40) + '...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      flatNumber: String
    }));

    // Find and update Kartik Dudeja's role
    const result = await User.findOneAndUpdate(
      { $or: [
        { email: { $regex: /kartik/i } },
        { name: { $regex: /kartik/i } }
      ]},
      { $set: { role: 'manager' } },
      { new: true }
    );

    if (result) {
      console.log('✅ Updated user:', result.name);
      console.log('   Email:', result.email);
      console.log('   New Role:', result.role);
    } else {
      console.log('❌ User not found with name or email containing "kartik"');
      
      // List all users to help find the right one
      const allUsers = await User.find({}, 'name email role flatNumber').limit(50);
      console.log('\nAll users in database:');
      allUsers.forEach((u, i) => console.log(`  ${i+1}. ${u.name} (${u.email}) - Role: ${u.role || 'undefined'}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateKartikRole();
