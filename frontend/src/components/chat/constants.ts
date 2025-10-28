// svg
import GetStarted from "../../assets/GetStarted.svg";
import SummaryIcon from "../../assets/SummaryIcon.svg";
import AnalyseIcon from "../../assets/AnalyseIcon.svg";

const URL_PATTERN =
	/(?:(?:https?:\/\/)|(?:www\.))?(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(?:[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?::\d{1,5})?(?:\/[^\s]*)?/g;
const GITHUB_URL_PATTERN =
	/(https?:\/\/)?(www\.)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_-]+)(\/(tree|blob)\/[a-zA-Z0-9-]+)?/;

const REPORT_GENERATION = ["summary", "generation", "report", "analysis"];
const NEGATION_PATTERN = /\b(do not|don't|no need to|stop|avoid)\b/i;
const REPORT_KEYWORDS = ["report", "generate report", "summary", "summarize"];
const NEGATION_PATTERNS = [
	/\b(?:not|no|never|none|neither|nor|without|won't|wouldn't|shouldn't|can't|cannot|couldn't|doesn't|didn't|isn't|aren't)\b/i,
	/n't\b/i,
];

const CREATE_FOLDER_ACTION = [
	{
		id: "1",
		name: "Create New Folder",
		type: "folder",
	},
];

const SPECIFIC_REPORT_PATTERN = /^generate a report$/i; // Exact match for "I want to generate a report"

const CLARIFICATION_PATTERNS =
	/\b(difference|compare|how|why|explain|what is|vs|versus)\b/i;

const STANDARDS = [
	{
		id: "1",
		name: "OWASP",
		type: "standards",
		description:
			"(Open Web Application Security Project) Focuses on improving the security of software applications by providing guidelines and best practices for identifying and mitigating common web application vulnerabilities.",
	},
	{
		id: "2",
		name: "PCIDSS",
		type: "standards",
		description:
			" (Payment Card Industry Data Security Standard) Ensures the protection of credit card information by setting security requirements for organizations handling cardholder data, aiming to prevent fraud and breaches.",
	},
	{
		id: "3",
		name: "ISO27001-A",
		type: "standards",
		description:
			"(International Organization for Standardization 27001 - A) A globally recognized standard for establishing, implementing, maintaining, and continually improving an organization’s information security management system (ISMS), ensuring the confidentiality, integrity, and availability of data.",
	},
	{
		id: "4",
		name: "NIST CSF",
		type: "standards",
		description:
			"(National Institute of Standards and Technology Cybersecurity Framework) Provides a structured approach to help organizations manage and reduce cybersecurity risks, offering guidelines and best practices to strengthen their security posture.",
	},
	{
		id: "5",
		name: "GDPR",
		type: "standards",
		description:
			"(General Data Protection Regulation) A regulation in the European Union that governs how organizations collect, store, and process personal data of EU citizens, giving individuals greater control over their data privacy and security.",
	},
	{
		id: "6",
		name: "HIPAA",
		type: "standards",
		description:
			"(Health Insurance Portability and Accountability Act) A U.S. regulation that mandates the secure handling and confidentiality of health information by healthcare providers, insurers, and related organizations, ensuring the protection of sensitive patient data.",
	},
];

const SCANTYPES = [
	{
		id: "1",
		name: "Passive Scan",
		type: "scan",
		description:
			"A non-intrusive scan type that monitors traffic without direct interaction.",
	},
	{
		id: "2",
		name: "Active Scan",
		type: "scan",
		description:
			"A more aggressive scan type that directly interacts with targets to identify vulnerabilities.",
	},
];

const GITHUB_SCAN = [
	{
		id: "1",
		name: "Private Repository",
		type: "github-scan",
		description: "",
	},
	{
		id: "2",
		name: "Public Repository",
		type: "github-scan",
		description: "",
	},
];

const REPORTS = [
	{
		id: "1",
		name: "Chat Summary Report",
		type: "report",
		description:
			"A summary report of the chat conversation between the user and MIRA.",
	},
	{
		id: "2",
		name: "Vulnerability Report",
		type: "report",
		description:
			"A detailed report of highlighted vulnerabilities identified during the scan.",
	},
];

const INITIAL_ACTION_CARDS = [
	{
		title: "Get Started",
		prompt: "Hi, how can I help you today?",
		icon: GetStarted,
	},
	{
		title: "Scan Website",
		prompt: "Please enter the URL to scan.",
		icon: AnalyseIcon,
	},
	{
		title: "Report Generation",
		prompt: "Please select the report type.",
		icon: SummaryIcon,
	},
];

const UPDATED_ACTION_CARDS = [
	{
		title: "Scan Website",
		prompt: "Please enter the URL for analysis.",
		icon: AnalyseIcon,
	},
	{
		title: "Generate Report",
		prompt: "Please select the type of report you need.",
		icon: SummaryIcon,
	},
	{
		title: "Ask Question",
		prompt: "I have a question about...",
		icon: GetStarted,
	},
];

export {
	SPECIFIC_REPORT_PATTERN,
	SCANTYPES,
	CREATE_FOLDER_ACTION,
	STANDARDS,
	REPORTS,
	URL_PATTERN,
	REPORT_GENERATION,
	NEGATION_PATTERN,
	INITIAL_ACTION_CARDS,
	UPDATED_ACTION_CARDS,
	REPORT_KEYWORDS,
	NEGATION_PATTERNS,
	CLARIFICATION_PATTERNS,
	GITHUB_URL_PATTERN,
	GITHUB_SCAN,
};
