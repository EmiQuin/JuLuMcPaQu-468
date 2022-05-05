import "./Home.css";
import { Text } from "@mantine/core";

function Home() {
	return (
		<div className="App">
			<Text component="h1" size={20}>
				Cloud Chess
			</Text>
			<Text>
					Sign in and play through the menu on the left
			</Text>
		</div>
	);
}

export default Home;
