import { DockIcon, Search, Github } from "lucide-react";

export const actionCards = [
	{
		title: "Scan a URL",
		icon: Search,
		useRAG: false,
		color: "text-purple-500",
	},
	{
		title: "Scan Github URL",
		icon: Github,
		useRAG: false,
		color: "text-yellow-500",
	},
	{
		title: "Latest CVE Updates",
		icon: DockIcon,
		useRAG: true,
		color: "text-red-500",
	},
];
