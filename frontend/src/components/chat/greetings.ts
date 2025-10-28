export const getGreeting = (timeZone: string): string => {
	const currentTime = new Date().toLocaleTimeString("en-US", {
		timeZone,
		hour12: false,
	});

	const hour = Number.parseInt(currentTime.split(":")[0], 10);

	if (hour >= 5 && hour < 12) {
		return "🌞 Good Morning";
	}
	if (hour >= 12 && hour < 18) {
		return "🌤️ Good Afternoon";
	}
	if (hour >= 18 && hour < 22) {
		return "🌆 Good Evening";
	}
	return "🌃 Happy Late Night";
};
