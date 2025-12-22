import { MongoClient } from "mongodb";

const SERVER_TIMEOUT_MS = 5000;
const url = "mongodb://localhost:27017/questionsDB";
const dbName = "questionsDB";


const mongoClient = new MongoClient(url, {
	serverSelectionTimeoutMS: SERVER_TIMEOUT_MS,
});
let db;
export async function connectDB() {
	try {
		await mongoClient.connect();
		db = mongoClient.db(dbName);
		console.log("MongoDB successfully connected to questionsDB");
	} catch (error) {
		console.error("Failed to connect to MongoDB or start server:");
		console.error("Check 1: Is your MongoDB service running on 27017?");
		console.error("Error details:", error.message);
		process.exit(1);
	}
}
export function getDB() {
	if (!db) {
		throw new Error("Database not initialized. Call connectDB first.");
	}
	return db;
}
