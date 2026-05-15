import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seedAdmin = async() =>{
    try{
        await mongoose.connect(MONGO_URI);
        const hashedpassword = await bcrypt.hash("admin123",10);
        await User.deleteMany({role: "admin"});

        const admins = [
            {
            name: "Admin1",
            email: "admin1@gmail.com",
            role:"admin",
            approvalStatus:"approved",
            password: hashedpassword,
            },
            {
                name:"Admin2",
                email:"admin2@gmail.com",
                password: hashedpassword,
                approvalStatus:"approved",
                role:"admin",
            },
        ];
        await User.insertMany(admins);
        console.log("Admins created succesfully");
        process.exit();
    }
    catch(err){
        console.error(err);
    }
};

seedAdmin();
