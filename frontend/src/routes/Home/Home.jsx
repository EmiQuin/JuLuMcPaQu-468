import "./Home.css";
import { Text } from "@mantine/core";
import { Image } from '@mantine/core';

function Home() {
	return (
		<div className="App">
			<Text component="h1" size={20}>
				Cloud Chess
			</Text>
			<Text>
				Sign in and play through the menu on the left
			</Text>
			<Image
				radius="md"
				src="https://images.ctfassets.net/3s5io6mnxfqz/wfAz3zUBbrcf1eSMLZi8u/c03ac28c778813bd72373644ee8b8b02/AdobeStock_364059453.jpeg?fm=jpg&w=900&fl=progressive"
				alt="chess photo"
		</div>
	);
}

export default Home;
