import type React from "react";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";

import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

import { Link } from "react-router-dom";
import { ModeToggle } from "../components/theme/mode-toggle";
import { HelpMenu } from "../components/chat/help-menu";

const TermsOfService: React.FC = () => {
	const navigate = useNavigate(); // Initialize the navigate hook

	return (
		<>
			<div className="fixed top-4 right-4">
				<ModeToggle />
			</div>
			<div className="container mx-auto p-6">
				<div className="flex items-center mb-4 w-96">
					<Button
						onClick={() => navigate(-1)}
						className="bg-transparent border border-white/50 backdrop-blur-md text-grey hover:bg-white/10 transition-all"
					>
						← Back
					</Button>
				</div>
				<Card className="shadow-lg max-w-6xl mx-auto">
					<CardHeader>
						<CardTitle className="text-center text-4xl font-bold">
							Terms of Service
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="prose max-w-none">
							<p className="text-gray-500 dark:text-gray-400">
								<strong>Last Updated:</strong> January 3, 2025
							</p>
							<br />
							<h2>
								<strong>1. Acceptance of Terms</strong>
							</h2>
							<p>
								By using any of our services, you acknowledge
								and agree to these Terms of Service and our
								Privacy Policy. We may update these terms from
								time to time, and we will notify you of
								significant changes. Continued use of our
								services after such updates will constitute your
								acceptance of the modified terms.
							</p>
							<br />
							<h2>
								<strong>2. User Eligibility</strong>
							</h2>
							<p>
								You must be at least 18 years old or have the
								legal capacity to form a binding contract in
								your jurisdiction. By using our services, you
								represent and warrant that you meet these
								requirements.
							</p>{" "}
							<br />
							<h2>
								<strong>3. Services Provided</strong>
							</h2>
							<p>
								denkMinds offers various products and services,
								including but not limited to digital platforms,
								tools, and collaborative projects aimed at
								promoting learning and knowledge sharing. We may
								add or remove services at any time at our sole
								discretion.
							</p>{" "}
							<br />
							<h2>
								<strong>4. Account Registration</strong>
							</h2>
							<p>
								Some features of our services may require you to
								create an account. You agree to provide
								accurate, complete, and up-to-date information
								during registration and keep your account
								details secure.
							</p>{" "}
							<br />
							<h2>
								<strong>5. User Responsibilities</strong>
							</h2>
							<p>
								By using our services, you agree to comply with
								all applicable laws and regulations and not
								engage in any activity that could harm, disable,
								or impair the functionality of our services.
							</p>{" "}
							<br />
							<h2>
								<strong>6. Data Privacy</strong>
							</h2>
							<p>
								We take your privacy seriously. Please refer to
								our{" "}
								<Link
									to="/privacy"
									className="underline hover:text-primary"
								>
									Privacy Policy
								</Link>{" "}
								for detailed information about how we collect,
								use, and protect your personal data.
							</p>{" "}
							<br />
							<h2>
								<strong>7. Prohibited Conduct</strong>
							</h2>
							<p>
								You agree not to use our services for any
								illegal or unauthorized purpose or interfere
								with the integrity or performance of our
								services.
							</p>{" "}
							<br />
							<h2>
								<strong>8. Intellectual Property</strong>
							</h2>
							<p>
								All content, logos, and trademarks displayed on
								our platforms are the property of denkMinds or
								its licensors. You may not reproduce,
								distribute, or create derivative works without
								prior written consent.
							</p>{" "}
							<br />
							<h2>
								<strong>9. Termination of Services</strong>
							</h2>
							<p>
								We reserve the right to suspend or terminate
								your access to our services at our sole
								discretion, with or without notice, for any
								reason, including violation of these terms.
							</p>{" "}
							<br />
							<h2>
								<strong>10. Limitation of Liability</strong>
							</h2>
							<p>
								To the fullest extent permitted by law,
								denkMinds shall not be liable for any indirect,
								incidental, or consequential damages arising
								from your use of our services.
							</p>{" "}
							<br />
							<h2>
								<strong>11. Contact Us</strong>
							</h2>
							<p>
								If you have any questions about these Terms of
								Service, please contact us at:
							</p>
							<p className="text-gray-500 dark:text-gray-400">
								Email:{" "}
								<a
									href="mailto:denkminds@gmail.com"
									className="underline"
								>
									denkminds@gmail.com
								</a>
							</p>
						</div>
					</CardContent>
				</Card>
				<p className="text-center text-gray-500 text-wrap text-xs mt-1">
					Copyright &copy; denkMinds, Planspiel
					Project {new Date().getFullYear()}
				</p>
			</div>
			<HelpMenu />
		</>
	);
};

export default TermsOfService;
