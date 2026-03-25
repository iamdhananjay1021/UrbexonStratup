import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; // ⚠️ .js extension mandatory

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const existingAdmin = await User.findOne({
            email: 'dhananjay07207@gmail.com'
        });

        if (existingAdmin) {
            console.log('Admin already exists ❌');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('Nikhil@0001', 10);
        const admin = await User.create({
            name: 'Admin',
            email: "dhananjay07207@gmail.com",
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true // ✅ correct field
        });

        console.log('Admin created ✅');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();