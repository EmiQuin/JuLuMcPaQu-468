import Home from "./routes/Home";
import Login from "./routes/Login";
import Register from "./routes/Signup";
import Profile from "./routes/Profile";
import CreateGame from "./routes/Game/CreateGame";
import ActiveGame from "./routes/Game";
import AnalyzeGame from "./routes/Game/AnalyzeGame";
import Error from "./routes/Error";

import { Routes, Route } from "react-router-dom";
import io from "socket.io-client";

const endpoint = "http://128.105.146.103:5000";
const socket = io(endpoint, { transports: ["websocket"] });

export default function App() {
	return (
		<>
			<Routes>
				<Route path="*" element={<Error />} />
				<Route exact path="/" element={<Home socket={socket} />} />
				<Route exact path="/login" element={<Login />} />
				<Route exact path="/signup" element={<Register />} />
				<Route exact path="/profile/:username" element={<Profile />} />
				<Route
					exact
					path="/game/create"
					element={<CreateGame socket={socket} />}
				/>
				<Route
					exact
					path="/game/:id"
					element={<ActiveGame socket={socket} />}
				/>
				<Route path="/:username/analyze/:gameId" element={<AnalyzeGame />} />
			</Routes>
		</>
	);
}
