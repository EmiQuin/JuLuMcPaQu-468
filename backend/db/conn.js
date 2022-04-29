const mongoose = require("mongoose");

const connectDB = async () => {
	console.log(`Process: ${process.env.ATLAS_URI}`)
	await mongoose.connect(process.env.ATLAS_URI, {
		dbName: "ChessGame",
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log("MongoDB Connected!");
};

module.exports = connectDB;
