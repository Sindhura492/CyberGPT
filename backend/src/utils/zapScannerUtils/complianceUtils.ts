export const inferCompliance = (cweId: string): Record<string, string[]> => {
	if (!cweId || cweId === "0") {
		return {
			OWASP: ["Uncategorized"],
			PCI_DSS: ["Uncategorized"],
			GDPR: ["Uncategorized"],
			ISO_27001: ["Uncategorized"],
		};
	}

	const compliance: Record<string, string[]> = {};

	if (cweId.startsWith("79")) {
		compliance.OWASP = ["A07:2021 - Cross-Site Scripting"];
	} else if (cweId.startsWith("89")) {
		compliance.OWASP = ["A03:2021 - Injection"];
	} else if (cweId.startsWith("693")) {
		compliance.OWASP = ["A05:2021 - Security Misconfiguration"];
	} else {
		compliance.OWASP = ["Uncategorized"];
	}

	if (cweId.startsWith("79")) {
		compliance.PCI_DSS = ["6.5.7 - Cross-Site Scripting"];
	} else if (cweId.startsWith("89")) {
		compliance.PCI_DSS = ["6.5.1 - SQL Injection"];
	} else {
		compliance.PCI_DSS = ["Uncategorized"];
	}

	compliance.GDPR = ["Article 32 - Security of Processing"];

	compliance.ISO_27001 = ["A.14.1.2"];

	return compliance;
};
