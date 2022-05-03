import "./Home.css";
import { Text } from "@mantine/core";

function Home() {
	return (
		<div className="App">
			<Text component="h1" size={20}>
				Chess Game Update
			</Text>
			<Text>
				Edit this page at: <code>frontend/routes/Home/Home.jsx</code>
			</Text>
			<img src="https://images.ctfassets.net/3s5io6mnxfqz/wfAz3zUBbrcf1eSMLZi8u/c03ac28c778813bd72373644ee8b8b02/AdobeStock_364059453.jpeg?fm=jpg&w=900&fl=progressive" alt="chess background">
		</div>
	);
}

export default Home;
