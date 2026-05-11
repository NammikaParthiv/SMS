import mongoose from "mongoose"

const connect2MongoDB = async()=>{
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI);
            console.log(`MongoDB connected Succesfully`);
        } catch (error) {
            console.log("MongoDB connection Failed",error.message);
            process.exit(1)//to avoid running the server in unstable state
        }
}

export default connect2MongoDB;