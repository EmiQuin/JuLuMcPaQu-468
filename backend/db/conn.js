const mongoose = require("mongoose");
const os = require('os');

const connectDB = async () => {
	const networkInterfaces = os.networkInterfaces();
	console.log(`IPs: ${networkInterfaces}`)
	await mongoose.connect(process.env.ATLAS_URI, {
		dbName: "ChessGame",
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log("MongoDB Connected!");
};

module.exports = connectDB;
