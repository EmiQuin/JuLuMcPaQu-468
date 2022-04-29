const mongoose = require("mongoose");
const os = require('os');

const connectDB = async () => {
	const networkInterfaces = os.networkInterfaces();
	console.log(`IPs: ${JSON.stringify(networkInterfaces)}`);
	console.log(process.env.ATLAS_URI);
	await mongoose.connect(process.env.ATLAS_URI, {
		dbName: "ChessGame",
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log("MongoDB Connected!");
};

module.exports = connectDB;
