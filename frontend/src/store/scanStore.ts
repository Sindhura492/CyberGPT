import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ScanState, ScanResult } from "../types/zap-scan";
import type { SonarScanReport } from "../types/sastTypes";

const useScanStore = create<ScanState>()(
	persist(
		(set) => ({
			scanResponse: {} as ScanResult,
			setScanResponse: (scanResponse: ScanResult) =>
				set((state) => ({ ...state, scanResponse })),
			scanSastResponse: {} as SonarScanReport,
			setScanSastResponse: (scanSastResponse: SonarScanReport) =>
				set((state) => ({ ...state, scanSastResponse })),
		}),
		{
			name: "scanData",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export default useScanStore;
