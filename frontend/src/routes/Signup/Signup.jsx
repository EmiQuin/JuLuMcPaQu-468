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

export default function Signup() {
	let navigate = useNavigate();
	const [username, setUsername] = useState("");
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
				"Content-Type": "appliction/json",
			},
		};

		try {
			const { data } = await axios.post(
				"http://128.105.146.103:50000/user/signup",
				{ username, email, password },
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
					<h2>Create Account</h2>
				</div>
				{error && <div className="error">{error}</div>}
				<form method="POST" onSubmit={handleSubmit}>
					<TextInput
						value={username}
						label="Username"
						placeholder="Your username"
						name="username"
						required
						error={error}
						onChange={(e) => setUsername(e.target.value)}
					/>
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
							Sign up
						</Button>
						<Text size="xs" color="dimmed">
							Already have an account?{" "}
							<Text size="xs" color="#4DABF7" component={Link} to="/login">
								Log in
							</Text>
						</Text>
					</Group>
				</form>
			</Card>
			<div className="media"></div>
		</div>
	);
}
