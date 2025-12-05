// Script to list all users with flat numbers
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI;

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      flatNumber: String
    }));

    const allUsers = await User.find({}, 'name email flatNumber role').sort({ flatNumber: 1 });
    
    console.log('All users with flat numbers:\n');
    allUsers.forEach(u => {
      console.log(`Flat: "${u.flatNumber}" | ${u.name} | ${u.email} | Role: ${u.role}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
