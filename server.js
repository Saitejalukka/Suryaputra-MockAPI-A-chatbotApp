import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import { MongoClient } from "mongodb";
import { connectDB, getDB } from "./db.js";

const PORT = 5000;

dotenv.config();

const app = express();
app.use(express.json());

const collectionName = "search_history";

const SERP_API_KEY =
	"3d9428b1c19eec091baf0b5d917fb7134025552ba20e35a6cd0c64360376aed8";


app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/register", async (req, res) => {
	try {
		const { name = "", userName = "", password = "" } = req.body;

		if (!name || !userName || !password) {
			return res.status(400).json({
				message: "Name, User Name, and Password are required",
			});
		}
		const db=getDB();
		const usersTableData = db.collection("users");

		const existingUser = await usersTableData.findOne({
			username: userName,
		});

		if (existingUser) {
			return res.status(409).json({
				message: "Username already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newEntry = {
			name,
			username: userName,
			password: hashedPassword,
			createdAt: new Date(),
		};
		await usersTableData.insertOne(newEntry);

		return res.status(201).json({
			message: "User registered successfully",
		});
	} catch (err) {
		console.error("Error =====>", err.message);

		if (err.code === 11000) {
			return res.status(409).json({
				message: "Username already exists",
			});
		}

		return res.status(500).json({
			message: "Internal Server Error",
		});
	}
});

app.post("/login", async (req, res) => {
	try {
		const { userName = "", password = "" } = req.body;

		if (!userName || !password) {
			return res.status(400).json({
				message: "Username and password are required",
			});
		}

		const db = getDB();
		const usersCollection = db.collection("users");


		const user = await usersCollection.findOne({
			username: userName,
		});

		if (!user) {
			return res.status(401).json({
				message: "Invalid username or password",
			});
		}

		const token = jwt.sign(
			{
				userId: user._id,
				username: user.username,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "24h" }
		);

		return res.status(200).json({
			message: "Login successful",
			token,
		});
	} catch (err) {
		console.error("Login Error =====>", err.message);
		return res.status(500).json({
			message: "Internal Server Error",
		});
	}
});

app.post("/search", async (req, res) => {
	const question = req.body.question;

	if (!question || typeof question !== "string" || question.trim() === "") {
		return res
			.status(400)
			.json({ message: "Missing search question in request body." });
	}

	console.log(`Processing Query: ${question}`);

	const BASE_URL = "https://serpapi.com/search";
	let answer = "Could not find a clear answer for that query.";

	try {
		const response = await axios.get(BASE_URL, {
			params: {
				api_key: SERP_API_KEY,
				engine: "google",
				q: question,
			},
		});

		const organicResults = response.data.organic_results;

		if (organicResults && organicResults.length > 0) {
			if (organicResults[0].snippet) {
				answer = organicResults[0].snippet;
			}
		}

		const db = getDB();
		if (db) {
			const searchHistory = db.collection(collectionName);
			const newEntry = {
				question: question,
				answer: answer,
				timestamp: new Date(),
			};

			searchHistory
				.insertOne(newEntry)
				.then(() => console.log(`Stored search query: "${question}"`))
				.catch((err) => console.error("MongoDB Insertion Error:", err.message));
		} else {
			console.warn("MongoDB client not available, skipping data storage.");
		}

		console.log(`Successfully proxied search for: ${question}`);
		res.json({ answer: answer });
	} catch (error) {
		const axiosError = error.response ? error.response.data : error.message;
		console.error("SERP API proxy error:", axiosError);

		res
			.status(500)
			.json({ message: "Error processing search request through proxy." });
	}
});
async function startServer(){
	await connectDB();
	app.listen(PORT, () => {
			console.log(`server running on http://127.0.0.1:${PORT}`);
		});
	}
startServer();
