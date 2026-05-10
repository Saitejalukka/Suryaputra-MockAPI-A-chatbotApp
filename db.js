import { MongoClient } from "mongodb";

let db;

export const connectDB = async () => {
	try {
		const client = new MongoClient(process.env.MONGODB_URI);

		await client.connect();

		db = client.db(process.env.DB_NAME);

		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection failed:", error);
		process.exit(1);
	}
};

export const getDB = () => {
	if (!db) throw new Error("Database not initialized");
	return db;
};