import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);

		console.log("MongoDB Connected");
	} catch (error) {
		console.log("MongoDB connection failed:", error);
	}
};

export default connectDB;
export const getDB = () => {
	if (!db) throw new Error("Database not initialized");
	return db;
};
