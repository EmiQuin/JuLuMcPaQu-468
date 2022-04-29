require("dotenv").config({ path: "./config.env" });
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(require("./routes/auth"));
app.use("/profile", require("./routes/profile"));
app.use("/game", require("./routes/game"));
// get driver connection
const connectDB = require("./db/conn");
const errorHandler = require("./middleware/error");
const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");

connectDB();

app.use(errorHandler);
const http = require("http").Server(app);
const io = require("socket.io")(http, {
	cors: {
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
	},
});

http.listen(port, () => {
	console.log(`Server is running on port: ${port}`);
});

let games = {};
let searchingPlayers = {
	"1+0": [],
	"1+1": [],
	"3+0": [],
	"3+2": [],
	"5+0": [],
	"5+5": [],
	"10+0": [],
	"15+0": [],
	"15+15": [],
};
io.on("connection", (socket) => {
	console.log("New user connected");
	socket.on("createRoom", (settings) => {
		if (settings.gameType === "public") {
			if (searchingPlayers[settings.timeControl].length === 0) {
				searchingPlayers[settings.timeControl].push({
					username: settings.username,
					socket,
				});
				socket.emit("findingOpponent");
			} else {
				const roomId = crypto.randomBytes(5).toString("hex");
				socket.join(roomId);
				const secondPlayer = searchingPlayers[settings.timeControl].pop();
				secondPlayer.socket.join(roomId);
				games[roomId] = {
					players: {},
					turn: 0,
					winner: null,
					vsComputer: settings.opponent === "computer",
					timeControl: settings.timeControl,
					fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				};
				games[roomId].players[settings.username] = {
					id: socket.id,
					color: Math.random() > 0.5 ? "white" : "black",
					timeLeft: parseInt(settings.timeControl) * 60,
				};
				games[roomId].players[secondPlayer.username] = {
					id: secondPlayer.socket.id,
					color:
						games[roomId].players[settings.username].color === "white"
							? "black"
							: "white",
					timeLeft: parseInt(settings.timeControl) * 60,
				};
				socket.emit("roomId", roomId);
				secondPlayer.socket.emit("roomId", roomId);
			}
		} else {
			const roomId = crypto.randomBytes(5).toString("hex");
			socket.join(roomId);
			games[roomId] = {
				players: {},
				turn: 0,
				winner: null,
				vsComputer: settings.opponent === "computer",
				timeControl: settings.timeControl,
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			};
			games[roomId].players[settings.username] = {
				id: socket.id,
				color:
					settings.color === "random"
						? Math.random() > 0.5
							? "white"
							: "black"
						: settings.color,
				timeLeft: parseInt(settings.timeControl) * 60,
			};

			if (settings.opponent === "computer") {
				games[roomId].players["Computer"] = {
					id: "computer",
					color:
						games[roomId].players[settings.username].color === "white"
							? "black"
							: "white",
					difficulty: settings.difficulty,
				};
			}
			socket.emit("roomId", roomId);
		}
	});

	socket.on("joinRoom", (newUser) => {
		// Check if room id is valid
		if (!games[newUser.roomId]) {
			socket.emit("roomNotFound");
			return;
		}

		// Check if user is already has a game in progress, redirect if so
		for (const [gameId, game] of Object.entries(games)) {
			for (const [key] of Object.entries(game.players)) {
				if (key === newUser.username && gameId !== newUser.roomId) {
					socket.emit("roomRedirect", gameId);
					return;
				}
			}
		}

		// Check if user is reconnecting to a game
		if (games[newUser.roomId].players[newUser.username]) {
			games[newUser.roomId].players[newUser.username].id = socket.id;
			socket.join(newUser.roomId);
			socket.join(`${newUser.roomId}-chat`);
			socket.emit("playerJoined", games[newUser.roomId]);
			return;
		}

		// Check to see if game already has two players
		if (Object.keys(games[newUser.roomId].players).length === 2) {
			socket.emit("roomFull");
			return;
		}

		// Determine joining players color
		let color;
		for (let key in games[newUser.roomId].players) {
			if (games[newUser.roomId].players[key].color === "black") {
				color = "white";
			} else {
				color = "black";
			}
		}

		// Add player to game
		if (!games[newUser.roomId].players.hasOwnProperty(newUser.username)) {
			games[newUser.roomId].players[newUser.username] = {
				id: socket.id,
				color: color,
				timeLeft: parseInt(games[newUser.roomId].timeControl.split("+")) * 60,
			};
		}
		socket.join(newUser.roomId);
		socket.join(`${newUser.roomId}-chat`);
		io.to(newUser.roomId).emit("playerJoined", games[newUser.roomId]);
	});

	socket.on("moveMade", (move) => {
		games[move.roomId].fen = move.fen;
		games[move.roomId].turn += 1;
		console.log(move);
		socket.broadcast.to(move.roomId).emit("opponentMoved", move);
	});

	socket.on("saveMove", (move) => {
		games[move.roomId].fen = move.fen;
		games[move.roomId].turn += 1;
	});

	socket.on("updateTime", (payload) => {
		games[payload.roomId].players[payload.player].timeLeft = payload.time;
		socket.broadcast
			.to(payload.roomId)
			.emit("updateOpponentTime", { seconds: payload.time });
	});

	socket.on("saveGame", async (roomId, result) => {
		const config = {
			header: {
				"Content-Type": "application/json",
			},
		};
		const payload = {
			turns: Math.round(games[roomId].turn / 2),
		};
		const playerOneReq = JSON.stringify({
			username: result.playerOne.name,
			fields: "_id username",
		});
		const playerTwoReq = JSON.stringify({
			username: result.playerTwo.name,
			fields: "_id username",
		});
		try {
			const playerOne = await axios({
				method: "get",
				url: "http://128.105.146.103:30081/user/get",
				headers: config.header,
				data: playerOneReq,
			});
			const playerTwo = await axios({
				method: "get",
				url: "http://128.105.146.103:30081/user/get",
				headers: config.header,
				data: playerTwoReq,
			});
			if (result.playerOne.color === "white") {
				payload.playerWhite = {
					_id: mongoose.Types.ObjectId(playerOne.data.user._id),
					username: playerOne.data.user.username,
				};
				payload.playerBlack = {
					_id: mongoose.Types.ObjectId(playerTwo.data.user._id),
					username: playerTwo.data.user.username,
				};
			} else {
				payload.playerWhite = {
					_id: mongoose.Types.ObjectId(playerTwo.data.user._id),
					username: playerTwo.data.user.username,
				};
				payload.playerBlack = {
					_id: mongoose.Types.ObjectId(playerOne.data.user._id),
					username: playerOne.data.user.username,
				};
			}
			if (result.winner === playerOne.data.user.username) {
				payload.winner = {
					_id: mongoose.Types.ObjectId(playerOne.data.user._id),
					username: playerOne.data.user.username,
				};
			} else {
				payload.winner = {
					_id: mongoose.Types.ObjectId(playerTwo.data.user._id),
					username: playerTwo.data.user.username,
				};
			}

			if (result.draw) {
				payload.draw = true;
			}
			payload.history = result.history;
			payload.date = new Date();
			payload.timeControl = result.timeControl;
			const savedGame = await axios.post(
				"http://128.105.146.103:30081/game/save",
				{
					...payload,
				},
				config
			);
			await axios.post(
				"http://128.105.146.103:30081/user/edit",
				{
					username: result.playerOne.name,
					toEdit: {
						$push: {
							matchHistory: {
								$each: [savedGame.data._id],
								$position: 0,
							},
						},
					},
				},
				config
			);
			await axios.post(
				"http://128.105.146.103:30081/user/edit",
				{
					username: result.playerTwo.name,
					toEdit: {
						$push: {
							matchHistory: {
								$each: [savedGame.data._id],
								$position: 0,
							},
						},
					},
				},
				config
			);
		} catch (err) {
			console.error(err);
		}
		delete games[roomId];
	});

	socket.on("gameOver", async (result) => {
		const config = {
			header: {
				"Content-Type": "application/json",
			},
		};
		if (result.draw) {
			let human = null;
			if (result.playerOne === "Computer") {
				human = result.playerTwo;
			} else if (result.playerTwo === "Computer") {
				human = result.playerOne;
			}
			if (human !== null) {
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{
							username: human,
							toEdit: {
								$inc: { draws: 1 },
								$push: { matchHistory: result.history },
							},
						},
						config
					);
				} catch (err) {
					console.error(err.message);
				}
			} else {
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{ username: result.playerOne, toEdit: { $inc: { draws: 1 } } },
						config
					);
				} catch (err) {
					console.error(err.message);
				}
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{ username: result.playerTwo, toEdit: { $inc: { draws: 1 } } },
						config
					);
				} catch (err) {
					console.error(err.message);
				}
			}
		} else {
			if (result.winner === "Computer") {
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{ username: result.loser, toEdit: { $inc: { losses: 1 } } },
						config
					);
				} catch (err) {
					console.error(err.message);
				}
			} else if (result.loser === "Computer") {
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{ username: result.winner, toEdit: { $inc: { wins: 1 } } },
						config
					);
				} catch (err) {
					console.error(err.message);
				}
			} else {
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{ username: result.winner, toEdit: { $inc: { wins: 1 } } },
						config
					);
				} catch (err) {
					console.error(err.message);
				}
				try {
					await axios.post(
						"http://128.105.146.103:30081/user/edit",
						{ username: result.loser, toEdit: { $inc: { losses: 1 } } },
						config
					);
				} catch (err) {
					console.error(err.message);
				}
			}
		}
		io.to(result.roomId).emit("endGame", result);
		socket.emit("saveGame", result);
		io.in(result.roomId).socketsLeave(result.roomId);
	});

	socket.on("sendMessage", (chatMessage) => {
		io.to(chatMessage.roomId).emit("receiveMessage", chatMessage);
	});

	socket.on("drawOffer", (offerDetails) => {
		io.to(offerDetails.roomId).emit("receiveMessage", {
			sender: "System",
			message: `${offerDetails.username} has offered a draw`,
			roomId: offerDetails.roomId,
		});
		socket.to(offerDetails.roomId).emit("drawOffered");
	});

	socket.on("declineDrawOffer", (offerDetails) => {
		io.to(offerDetails.roomId).emit("receiveMessage", {
			sender: "System",
			message: `${offerDetails.username} has declined the draw offer`,
			roomId: offerDetails.roomId,
		});
		io.in(offerDetails.roomId).emit("drawOfferDeclined");
	});

	socket.on("cancelDrawOffer", (offerDetails) => {
		io.to(offerDetails.roomId).emit("receiveMessage", {
			sender: "System",
			message: `${offerDetails.username} has cancelled their draw offer`,
			roomId: offerDetails.roomId,
		});
		io.in(offerDetails.roomId).emit("drawOfferCancelled");
	});

	socket.on("rematchRequest", (requestDetails) => {
		if (requestDetails.opponent === "Computer") {
			socket.to(`${requestDetails.roomId}`).emit("restartGame");
		} else {
			io.to(requestDetails.roomId).emit("receiveMessage", {
				sender: "System",
				message: `${requestDetails.username} has offered a rematch`,
				roomId: `${requestDetails.roomId}-chat`,
			});
			socket.to(`${requestDetails.roomId}`).emit("rematchRequested");
		}
	});

	socket.on("declineRematchRequest", (requestDetails) => {
		io.to(requestDetails.roomId).emit("receiveMessage", {
			sender: "System",
			message: `${requestDetails.username} has declined the rematch`,
			roomId: `${requestDetails.roomId}-chat`,
		});
		io.in(requestDetails.roomId).emit("rematchRequestDeclined");
	});

	socket.on("restartGame", (data) => {
		for (let key of Object.keys(data.players)) {
			if (key !== "Computer") {
				io.sockets.sockets.get(data.players[key].id).join(data.roomId);
			}
		}
		games[data.roomId] = {
			players: data.players,
			turn: 0,
			winner: null,
			vsComputer: data.vsComputer,
			timeControl: data.timeControl,
			fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		};
		games[data.roomId].players = data.players;
		io.in(data.roomId).emit("refreshGame");
	});

	socket.on("cancelSearch", (query) => {
		const removeIndex = searchingPlayers[query.timeControl].findIndex(
			(player) => player[query.username]
		);
		searchingPlayers[query.timeControl].splice(removeIndex, 1);
	});

	socket.on("disconnect", () => {
		console.log("Client disconnected");
	});
});
