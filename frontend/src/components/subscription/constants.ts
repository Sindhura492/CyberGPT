const SUBSCRIPTION_PLANS = [
	{
		name: "Free Trial",
		price: "€0",
		description: "Perfect for trying out our services",
		features: ["3 URL Scans", "Passive Scanning", "Limited Code Analysis"],
		cta: "Start Free Trial",
		planKey: "free",
	},
	{
		name: "Standard",
		price: "€9.99",
		description: "Great for small teams and growing businesses",
		features: [
			"Unlimited URL Scans",
			"Passive and Active Scanning",
			"Unlimited Code Analysis",
			"Agentic AI for CVE Analysis",
			"AI powered latest CVE updates",
		],
		cta: "Upgrade to Standard",
		planKey: "intermediate",
	},
];

export { SUBSCRIPTION_PLANS };
