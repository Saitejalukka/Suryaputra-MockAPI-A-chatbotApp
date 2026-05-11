import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import user from "./models/user.js";

import db,{ connectDB, getDB } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const COLLECTION_SEARCH_HISTORY = "search_history";
const SERP_API_KEY = process.env.SERP_API_KEY;

app.post("/register", async (req, res) => {
	try {
		const { name, username, password } = req.body;
		if (!name || !username || !password) {
			return res.status(400).json({
				message: "Name, User Name, and Password are required",
			});
		}

		const db = getDB();
		if (existinguser) {
			return res.status(409).json({
				message: "Username already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await UserCollection.insertOne({
			name,
			username: username,
			password: hashedPassword,
			createdAt: new Date(),
		});

		return res.status(201).json({
			message: "User registered successfully",
		});
	} catch (error) {
		console.error("Register Error:", error.message);
		return res.status(500).json({
			message: "Internal Server Error",
		});
	}
});

app.post("/login", async (req, res) => {
	try {
		const { username = "", password = "" } = req.body;
		console.log(username);
		console.log(password);
		if (!username || !password) {
			return res.status(400).json({
				message: "Username and password are required",
			});
		}


		const User = await user.findOne({ 
			username,
			password,
		});
		console.log(User)

		if (!User) {
			return res.status(401).json({
				message: "Invalid username or password",
			});
		}
		
		const isMatch = await bcrypt.compare(password, User.password);
		if (!isMatch) {
			return res.status(401).json({
				message: "Invalid username or password",
			});
		}

		const token = jwt.sign(
			{
				userId: User._id,
			},
			process.env.JWT_SECRET,
			{
				expiresIn: "24h",
			},
		);
		return res.status(200).json({
			message: "Login successful",
			token,
		});
	} catch (error) {
		console.error("Login Error:", error.message);
		return res.status(500).json({
			message: "Internal Server Error",
		});
	}
});

app.post("/search", async (req, res) => {
	const { question } = req.body;

	if (!question || typeof question !== "string" || !question.trim()) {
		return res.status(400).json({
			message: "Missing or invalid search question.",
		});
	}

	try {
		const response = await axios.get("https://serpapi.com/search", {
			params: {
				api_key: SERP_API_KEY,
				engine: "google",
				q: question,
			},
		});

		let answer = "Could not find a clear answer.";

		const results = response.data?.organic_results;
		if (results?.length && results[0]?.snippet) {
			answer = results[0].snippet;
		}

		const db = getDB();
		await db.collection(COLLECTION_SEARCH_HISTORY).insertOne({
			question,
			answer,
			timestamp: new Date(),
		});

		return res.json({ answer });
	} catch (error) {
		console.error("Search Error:", error.message);
		return res.status(500).json({
			message: "Error processing search request.",
		});
	}
});

const startServer = async () => {
	try {
		await connectDB();
		app.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error("Server failed to start:", error.message);
		process.exit(1);
	}
};

startServer();
