const calculateTimeDifference = (scan: { _creationTime: string }) => {
	const now = Date.now();
	const scanTime = new Date(scan._creationTime).getTime();
	const diffInMs = now - scanTime;
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
	const diffInHours = Math.floor(diffInMinutes / 60);
	const diffInMonths = Math.floor(diffInHours / (24 * 30));

	if (diffInMonths > 0) {
		return `${diffInMonths} month(s) ago`;
	}
	if (diffInHours > 0) {
		return `${diffInHours} hour(s) ago`;
	}
	return `${diffInMinutes} minute(s) ago`;
};

export default calculateTimeDifference;
