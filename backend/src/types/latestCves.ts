export type CVEDocument = {
	id: string;
	sourceIdentifier: string;
	published: string;
	lastModified: string;
	vulnStatus: string;
	cveTags: string[];
	descriptions: Array<{
		lang: string;
		value: string;
	}>;
	metrics: {
		cvssMetricV40?: Array<{
			source: string;
			type: string;
			cvssData: {
				version: string;
				vectorString: string;
				baseScore: number;
				baseSeverity: string;
				attackVector?: string;
				attackComplexity?: string;
				privilegesRequired?: string;
				userInteraction?: string;
				vulnerableSystemConfidentiality?: string;
				vulnerableSystemIntegrity?: string;
				vulnerableSystemAvailability?: string;
			};
		}>;
		cvssMetricV31?: Array<{
			source: string;
			type: string;
			cvssData: {
				version: string;
				vectorString: string;
				baseScore: number;
				baseSeverity: string;
				attackVector?: string;
				attackComplexity?: string;
				privilegesRequired?: string;
				userInteraction?: string;
				scope?: string;
				confidentialityImpact?: string;
				integrityImpact?: string;
				availabilityImpact?: string;
			};
			exploitabilityScore?: number;
			impactScore?: number;
		}>;
		cvssMetricV2?: Array<{
			source: string;
			type: string;
			cvssData: {
				version: string;
				vectorString: string;
				baseScore: number;
				baseSeverity: string;
				accessVector: string;
				accessComplexity: string;
				authentication: string;
				confidentialityImpact: string;
				integrityImpact: string;
				availabilityImpact: string;
			};
			baseSeverity: string;
			exploitabilityScore?: number;
			impactScore?: number;
			acInsufInfo?: boolean;
			obtainAllPrivilege?: boolean;
			obtainUserPrivilege?: boolean;
			obtainOtherPrivilege?: boolean;
			userInteractionRequired?: boolean;
		}>;
	};
	weaknesses?: Array<{
		source: string;
		type: string;
		description: Array<{
			lang: string;
			value: string;
		}>;
	}>;
	references?: Array<{
		url: string;
		source: string;
	}>;
	configurations?: {
		nodes: Array<{
			cpeMatch: Array<{
				criteria: string;
			}>;
		}>;
	};
};

export interface WeaknessDescription {
	lang: string;
	value: string;
}

export interface Weakness {
	source: string;
	type: string;
	description: WeaknessDescription[];
}
