// Script to update all user roles
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

async function updateUserRoles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      flatNumber: String
    }));

    // 1. Set Kartik (admin email) as manager
    const kartikResult = await User.findOneAndUpdate(
      { email: 'admin@icontower.com' },
      { $set: { role: 'manager' } },
      { new: true }
    );
    if (kartikResult) {
      console.log('✅ Updated Kartik to MANAGER:', kartikResult.name, '-', kartikResult.email);
    } else {
      console.log('⚠️ admin@icontower.com not found');
    }

    // 2. Set specific flats as admin using email pattern (310, 311, 104, 402)
    const adminEmails = ['310@icontower.com', '311@icontower.com', '104@icontower.com', '402@icontower.com'];
    for (const email of adminEmails) {
      const result = await User.findOneAndUpdate(
        { email: email },
        { $set: { role: 'admin' } },
        { new: true }
      );
      if (result) {
        console.log(`✅ Updated ${email} to ADMIN:`, result.name);
      } else {
        console.log(`⚠️ No user found for email ${email}`);
      }
    }

    // 3. Set everyone else as 'user' (member)
    const updateResult = await User.updateMany(
      { 
        email: { $nin: ['admin@icontower.com', ...adminEmails] }
      },
      { $set: { role: 'user' } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} other users to MEMBER role`);

    // Show final state
    console.log('\n📋 Final user roles:');
    const allUsers = await User.find({}, 'name email flatNumber role').sort({ role: 1, name: 1 });
    
    console.log('\n--- MANAGERS ---');
    allUsers.filter(u => u.role === 'manager').forEach(u => 
      console.log(`  ${u.name} (${u.email})`)
    );
    
    console.log('\n--- ADMINS ---');
    allUsers.filter(u => u.role === 'admin').forEach(u => 
      console.log(`  ${u.name} (${u.email})`)
    );
    
    console.log('\n--- MEMBERS ---');
    const members = allUsers.filter(u => u.role === 'user');
    console.log(`  Total members: ${members.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateUserRoles();
