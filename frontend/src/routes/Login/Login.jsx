import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Button,
	Card,
	Group,
	TextInput,
	PasswordInput,
	Text,
} from "@mantine/core";
import axios from "axios";
import "./login.css";

export default function Login() {
	let navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (localStorage.getItem("authToken")) {
			window.location = "/";
		}
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();

		const config = {
			header: {
				"Content-Type": "application/json",
			},
		};

		try {
			const { data } = await axios.post(
				"http://128.105.146.103:5000/user/login",
				{ email, password },
				config
			);

			localStorage.setItem("authToken", data.token);
			// navigate("/");
			window.location = "/";
		} catch (error) {
			setError(error.response.data.error);
			setTimeout(() => {
				setError("");
			}, 5000);
		}
	};
	return (
		<div className="container">
			<Card className="card" shadow="md" padding="lg">
				<div className="form-header">
					<h2>Log in</h2>
				</div>
				<form method="POST" onSubmit={handleSubmit}>
					<TextInput
						type="email"
						value={email}
						label="Email"
						placeholder="example@test.com"
						name="email"
						required
						error={error}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<PasswordInput
						label="Password"
						placeholder="Your password"
						required
						error={error}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<Group className="submit-group" position="apart">
						<Button
							type="submit"
							variant="gradient"
							gradient={{ from: "indigo", to: "cyan" }}
						>
							Log in
						</Button>
						<Text size="xs" color="dimmed">
							Don't have an account?{" "}
							<Text size="xs" color="#4DABF7" component={Link} to="/signup">
								Sign up
							</Text>
						</Text>
					</Group>
				</form>
			</Card>
			<div className="media"></div>
		</div>
	);
}
