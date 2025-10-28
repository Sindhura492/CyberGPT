import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "./components/theme/theme-provider";

import Chatbot from "./pages/Chatbot";
import { Settings } from "./pages/Settings";
import { Layout } from "./components/dashboard/Layout";
import { Reports } from "./pages/Reports";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ProfileSettings from "./pages/ProfileSettings";
import ForgotPassword from "./pages/ForgotPassword";
import { RecentScans } from "./pages/scans/RecentScans";
import { ApiScans } from "./pages/scans/ApiScans";
import Vulnerabilities from "./pages/scans/vulnerabilities/vulnerabilities";
import Urls from "./pages/scans/VulnerableUrls/Urls";
import { RecentStaticScans } from "./pages/static-scans/RecentStaticScans";
import { FileView } from "./components/file";
import PrivateRoute from "./components/privateRoutes";
import { NotFound } from "./pages/NotFound";
import TermsOfService from "./pages/Termsofservice";
import PrivacyPolicy from "./pages/Privacy";
import { ChatTemplate } from "./components/PDF/Chattemplate";
import { ChatSummaries } from "./components/PDF/ChatSummaries";
import ScanHotspots from "./pages/static-scans/ScanHotspots";
import ScanIssues from "./pages/static-scans/ScanIssues";
import ScanIssuesDetails from "./pages/static-scans/ScanIssuesDetails";
import { FAQs } from "./pages/FAQs";
import Subscriptions from "./pages/Subscriptions";
import DastTest from "./pages/DastTest";

const App = () => {
	return (
		<>
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<Toaster />
				<Router>
					<Routes>
						<Route path="/" element={<Auth />} />
						<Route path="/login" element={<Auth />} />
						<Route path="/register" element={<Auth />} />
						<Route
							path="/forgot-password"
							element={<ForgotPassword />}
						/>
						<Route path="/terms" element={<TermsOfService />} />
						<Route path="/Privacy" element={<PrivacyPolicy />} />
						<Route
							path="/auth/callback"
							element={<AuthCallback />}
						/>
						<Route
							element={
								<PrivateRoute>
									{" "}
									<Layout />
								</PrivateRoute>
							}
						>
							<Route
								path="/chat/:_id"
								element={<ChatTemplate />}
							/>
							<Route
								path="/chatbot/:chatId?"
								element={<Chatbot />}
							/>
							<Route
								path="chat-summaries"
								element={<ChatSummaries />}
							/>

							<Route path="/settings" element={<Settings />} />
							<Route
								path="/recent-scan"
								element={<RecentScans />}
							/>
							<Route
								path="/recent-scan/:scanId/"
								element={<Vulnerabilities />}
							/>
							<Route
								path="/recent-scan/:scanId/vulnerability/:vulnerabilityId/"
								element={<Urls />}
							/>
							<Route
								path="/recent-static-scans"
								element={<RecentStaticScans />}
							/>
							<Route
								path="/recent-static-scans/hotspots/:staticScanId/"
								element={<ScanHotspots />}
							/>
							<Route
								path="/recent-static-scans/issues/:staticScanId/"
								element={<ScanIssues />}
							/>
							<Route
								path="/recent-static-scans/issues/:staticScanId/details/:issueId"
								element={<ScanIssuesDetails />}
							/>
							<Route path="/api-scan" element={<ApiScans />} />
							<Route
								path="/reports/:reportId?"
								element={<Reports />}
							/>
							<Route
								path="/accounts"
								element={<ProfileSettings />}
							/>
							<Route
								path="/file/:fileId"
								element={<FileView />}
							/>
							<Route path="/faqs" element={<FAQs />} />
							<Route
								path="/subscription"
								element={<Subscriptions />}
							/>
							<Route
								path="/dast-test"
								element={<DastTest />}
							/>
						</Route>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Router>
			</ThemeProvider>
		</>
	);
};

export default App;
