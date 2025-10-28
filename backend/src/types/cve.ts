export interface CVEDocument {
	data_type: string;
	data_format: string;
	data_version: string;
	CVE_data_meta: {
		ID: string;
		ASSIGNER: string;
	};
	description: {
		description_data: Array<{
			lang: string;
			value: string;
		}>;
	};
	impact?: {
		baseMetricV3?: {
			cvssV3: {
				baseScore: number;
				baseSeverity: string;
			};
		};
	};
}
