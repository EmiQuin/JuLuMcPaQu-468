import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
	Anchor,
	Avatar,
	Button,
	Card,
	ColorSwatch,
	Divider,
	Group,
	Table,
	Text,
	Title,
	useMantineTheme,
} from "@mantine/core";
import jwt_decode from "jwt-decode";
import axios from "axios";
import styles from "./Profile.module.css";

export default function Profile() {
	let params = useParams();
	let navigate = useNavigate();
	const [user, setUser] = useState({});
	const [matchHistory, setMatchHistory] = useState([]);
	const theme = useMantineTheme();
	let config = {
		method: "get",
		url: "http://128.105.146.103:50000/profile",
		headers: {
			"Content-Type": "appliction/json",
			Authorization: `Bearer ${localStorage.getItem("authToken")}`,
		},
	};
	useEffect(() => {
		let isCancelled = false;
		if (localStorage.getItem("authToken")) {
			const decoded = jwt_decode(localStorage.getItem("authToken"));
			if (decoded.username !== params.username) {
				navigate("/");
			} else {
				const fetchData = async () => {
					try {
						const { data } = await axios(config);
						if (!isCancelled) {
							setUser(data.data);
						}
					} catch (error) {
						console.error(error);
					}
				};
				fetchData();
			}
		}

		return () => (isCancelled = true);
	}, []);

	useEffect(() => {
		let isCancelled = false;
		const fetchMatchHistory = async () => {
			if (user.matchHistory !== undefined) {
				try {
					const config = {
						header: {
							"Content-Type": "application/json",
						},
					};
					const matchData = await axios.post(
						"http://128.105.146.103:50000/game/getAllUser",
						{
							idList: user.matchHistory,
						},
						config
					);
					if (!isCancelled) {
						const sortedGames = matchData.data.games.sort(
							(a, b) => new Date(b.date) - new Date(a.date)
						);
						setMatchHistory(sortedGames);
					}
				} catch (error) {
					console.error(error);
				}
			}
		};
		fetchMatchHistory();
		return () => (isCancelled = true);
	}, [user]);

	const matchTable = () => {
		return matchHistory?.map((match) => (
			<tr
				key={match._id}
				onClick={() => navigate(`/${user?.username}/analyze/${match._id}`)}
				style={{ cursor: "pointer" }}
			>
				<td>{match.timeControl ? match.timeControl : "N/A"}</td>
				<td>
					<Group direction="column" spacing={0}>
						<Group>
							<ColorSwatch size={12} color={"white"} />
							<Text>{match.playerWhite.username}</Text>
						</Group>
						<Group>
							<ColorSwatch size={12} color={"#868484"} />
							<Text>{match.playerBlack.username}</Text>
						</Group>
					</Group>
				</td>
				<td>
					{match.draw ? "Draw" : match.winner._id === user._id ? "Won" : "Lost"}
				</td>
				<td>{match.turns}</td>
				<td>
					{new Date(match.date).toString().split(" ").splice(1, 3).join(" ")}
				</td>
			</tr>
		));
	};

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Card width={800}>
				{user.username ? (
					<div className="profile-container">
						<div className={styles.profile_header}>
							<Group>
								<Avatar color="blue" size="xl">
									{user.username?.charAt(0)}
								</Avatar>
								<Group direction="column" spacing={0}>
									<Title component="h2" style={{ fontSize: "24px" }}>
										{user.username}
									</Title>
									<Text>{user.email}</Text>
									<Group spacing={10}>
										<Text>
											{user.wins}{" "}
											<span style={{ color: theme.colors["green"][7] }}>W</span>
										</Text>
										<Text>
											{user.losses}{" "}
											<span style={{ color: theme.colors["red"][7] }}>L</span>
										</Text>
										<Text>
											{user.draws}{" "}
											<span style={{ color: theme.colors["gray"][6] }}>D</span>
										</Text>
									</Group>
								</Group>
							</Group>
						</div>
						<Divider />
						<div className={styles.profile_body}>
							{user.matchHistory &&
							user.matchHistory.length &&
							matchHistory.length !== 0 ? (
								<div style={{ width: 500 }}>
									<Table highlightOnHover>
										<thead>
											<tr>
												<th>Format</th>
												<th>Players</th>
												<th>Result</th>
												<th>Moves</th>
												<th>Date</th>
											</tr>
										</thead>
										<tbody>{matchTable()}</tbody>
									</Table>
								</div>
							) : (
								<Group direction="column" spacing={0} position="center">
									<Text>No match history</Text>
									<Anchor component={Link} to={`/game/create`}>
										Play a game?
									</Anchor>
								</Group>
							)}
						</div>
					</div>
				) : (
					<div className="profile-container">
						<Group direction="column" position="center">
							<Text style={{ fontSize: "1.5rem" }}>Please log in again</Text>
							<Button
								onClick={() => {
									localStorage.removeItem("authToken");
									window.location = "/login";
								}}
							>
								Log out
							</Button>
						</Group>
					</div>
				)}
			</Card>
		</div>
	);
}
