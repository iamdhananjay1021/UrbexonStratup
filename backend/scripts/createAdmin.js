/**
 * createAdmin.js — Run once to create the first admin account
 * Usage: npm run create-admin
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "readline";

dotenv.config();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
    console.log("\n🔐 Urbexon Admin Account Creator\n");

    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI not set in .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const { default: User } = await import("../models/User.js");

    const name     = await ask("Admin Name: ");
    const email    = await ask("Admin Email: ");
    const password = await ask("Password (min 8 chars): ");
    const role     = await ask("Role [admin/owner] (default: admin): ") || "admin";

    if (!name.trim() || !email.trim() || password.length < 8) {
        console.error("❌ Invalid input");
        process.exit(1);
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
        console.log(`⚠️  Account already exists with role: ${exists.role}`);
        process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({
        name:            name.trim(),
        email:           email.toLowerCase().trim(),
        password:        hashed,
        phone:           "9999999999",
        role:            ["admin","owner"].includes(role) ? role : "admin",
        isEmailVerified: true,
    });

    console.log(`\n✅ Admin created successfully!`);
    console.log(`   ID:    ${admin._id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}\n`);

    rl.close();
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
