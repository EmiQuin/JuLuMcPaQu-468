import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useParams } from "react-router-dom";
import {
	Avatar,
	Button,
	Card,
	Divider,
	Group,
	ScrollArea,
	Text,
} from "@mantine/core";
import {
	IoPlaySkipForward,
	IoPlaySkipBack,
	IoPlayForward,
	IoPlayBack,
} from "react-icons/io5";

import axios from "axios";

export default function AnalyzeGame() {
	let params = useParams();
	const containerRef = useRef();
	const [game, setGame] = useState(new Chess());
	const [currentMove, setCurrentMove] = useState(0);
	const [fenHistory, setFenHistory] = useState([]);
	const [moveHistory, setMoveHistory] = useState([]);
	const [finished, setFinished] = useState(false);
	const [gameDetails, setGameDetails] = useState({
		playerWhite: { username: "" },
		playerBlack: { username: "" },
	});
	const [chessboardSize, setChessboardSize] = useState(undefined);

	useLayoutEffect(() => {
		let isCancelled = false;
		const controller = new AbortController();
		const fetchData = async () => {
			if (!isCancelled) {
				try {
					const { data } = await axios.post(
						`http://128.105.146.103:30081/game/get`,
						{
							id: params.gameId,
						},
						{
							headers: {
								"Content-Type": "application/json",
							},
						}
					);
					if (!isCancelled) {
						setGameDetails(data.game);
						game.load_pgn(data.game.history);
						setMoveHistory(game.history());
						let t = [];
						for (let _ of game.history()) {
							t.push(game.fen());
							game.undo();
						}
						t.push("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
						t.reverse();
						setFenHistory(t);
						setFinished(true);
					}
				} catch (error) {
					console.error(error);
				}
			}
		};
		if (!isCancelled) {
			function handleResize() {
				const display = containerRef.current;
				setChessboardSize(
					Math.min(display.offsetWidth - 100, display.offsetHeight - 100)
				);
			}
			window.addEventListener("resize", handleResize);
			handleResize();
			fetchData();
		}

		return () => {
			isCancelled = true;
			controller.abort();
		};
	}, []);

	const renderHistory = () => {
		let gameHistory = moveHistory;
		let finalHistory = [];
		for (let i = 0; i < gameHistory.length; i += 2) {
			try {
				finalHistory.push([
					{ move: gameHistory[i], moveIndex: i },
					{ move: gameHistory[i + 1], moveIndex: i + 1 },
				]);
			} catch {
				finalHistory.push([gameHistory[i]]);
			}
		}
		return finalHistory.map((turn, index) => (
			<Group key={index} position="left" noWrap spacing={0}>
				<Text component="p" style={{ width: "10%" }}>
					{index + 1}.
				</Text>
				<Button
					variant="subtle"
					style={{
						width: "45%",
						backgroundColor:
							currentMove === turn[0].moveIndex + 1
								? "rgba(25, 113, 194, 0.35)"
								: "",
						fontFamily: "Noto Chess, Noto Sans",
						fontSize: "0.95rem",
					}}
					onClick={() => setCurrentMove(turn[0].moveIndex + 1)}
				>
					{turn[0].move}
				</Button>
				{turn[1].move !== undefined && (
					<Button
						variant="subtle"
						style={{
							width: "45%",
							backgroundColor:
								currentMove === turn[1].moveIndex + 1
									? "rgba(25, 113, 194, 0.35)"
									: "",
							fontFamily: "Noto Chess, Noto Sans",
							fontSize: "0.95rem",
						}}
						onClick={() => setCurrentMove(turn[1].moveIndex + 1)}
					>
						{turn[1].move}
					</Button>
				)}
			</Group>
		));
	};

	return (
		<div
			className="game-container"
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				className="parent-container"
				style={{ width: "100%", height: "calc(100vh - 32px)" }}
			>
				<div
					className="board-container"
					style={{ maxWidth: "940px" }}
					ref={containerRef}
				>
					<div style={{ width: chessboardSize, marginBottom: "1rem" }}>
						<Group>
							<Avatar color="blue" size="md">
								{gameDetails.playerWhite.username === params.username
									? gameDetails.playerBlack.username.charAt(0)
									: gameDetails.playerWhite.username.charAt(0)}
							</Avatar>
							<Text component="p" size="xl">
								{gameDetails.playerWhite.username === params.username
									? gameDetails.playerBlack.username
									: gameDetails.playerWhite.username}
							</Text>
						</Group>
					</div>
					<Chessboard
						position={fenHistory[currentMove]}
						customBoardStyle={{
							borderRadius: "4px",
							boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
						}}
						boardWidth={chessboardSize}
						boardOrientation={
							gameDetails.playerWhite.username === params.username
								? "white"
								: "black"
						}
					/>
					<div style={{ width: chessboardSize, marginTop: "1rem" }}>
						<Group>
							<Avatar color="blue" size="md">
								{params.username.charAt(0)}
							</Avatar>
							<Text component="p" size="xl">
								{params.username}
							</Text>
						</Group>
					</div>
				</div>
				<Card className="chat-card" style={{ height: chessboardSize }}>
					<Text style={{ fontSize: "1.5em", fontWeight: "bold" }}>History</Text>
					<Divider />
					<ScrollArea style={{ height: "90%", marginBottom: "0.25em" }}>
						{finished && renderHistory()}
					</ScrollArea>
					<Group noWrap>
						<Button variant="subtle" onClick={() => setCurrentMove(0)}>
							<IoPlayBack />
						</Button>
						<Button
							variant="subtle"
							onClick={() => {
								setCurrentMove((currentMove) => Math.max(0, currentMove - 1));
							}}
						>
							<IoPlaySkipBack />
						</Button>
						<Button
							variant="subtle"
							onClick={() =>
								setCurrentMove((currentMove) =>
									Math.min(fenHistory.length - 1, currentMove + 1)
								)
							}
						>
							<IoPlaySkipForward />
						</Button>
						<Button
							variant="subtle"
							onClick={() => setCurrentMove(fenHistory.length - 1)}
						>
							<IoPlayForward />
						</Button>
					</Group>
				</Card>
			</div>
		</div>
	);
}
