import ProfileForm from "../components/profile/form";
import PasswordForm from "../components/passsword/password-form";
import useStore from "../store/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "../components/ui/badge";
import { Shield, User, Palette, Key, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/dialog";
import { handleDelete } from "../components/profile/profile-actions";
import { showErrorToast } from "../components/toaster";
import { useState } from "react";
import { useTheme } from "../components/theme/theme-provider";

const ProfileSettings = () => {
	const user = useStore((state) => state.user);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const { theme, setTheme } = useTheme();
	
	return (
		<div className="h-full bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl pb-8">
				{/* Main Content Grid */}
				<div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
					{/* Profile Section - Takes full width on mobile, 2 columns on desktop */}
					<div className="lg:col-span-2 space-y-6">
						{/* Profile Information Card */}
						<Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-lg bg-blue-500/10">
										<User className="h-5 w-5 text-blue-500" />
									</div>
									<div className="flex-1 min-w-0">
										<CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
										<CardDescription>
											Update your personal details and avatar
										</CardDescription>
									</div>
									{user?.authProvider === "google" && (
										<Badge variant="secondary" className="ml-auto shrink-0">
											Google Account
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<ProfileForm />
							</CardContent>
						</Card>

						{/* Password Section - Always show for all users */}
						<Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-lg bg-green-500/10">
										<Key className="h-5 w-5 text-green-500" />
									</div>
									<div>
										<CardTitle className="text-xl font-semibold">Password & Security</CardTitle>
										<CardDescription>
											Change your password to keep your account secure
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<PasswordForm />
							</CardContent>
						</Card>
					</div>

					{/* Sidebar - Takes full width on mobile, 1 column on desktop */}
					<div className="space-y-4">
						{/* Theme Settings Card - Compact with three options */}
						<Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2">
									<div className="p-1.5 rounded-lg bg-purple-500/10">
										<Palette className="h-4 w-4 text-purple-500" />
									</div>
									<div>
										<CardTitle className="text-base font-semibold">Appearance</CardTitle>
										<CardDescription className="text-xs">
											Customize your interface theme
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pb-3">
								<div className="space-y-2">
									<div 
										className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
											theme === "light" 
												? "bg-primary/10 border border-primary/20 shadow-sm" 
												: "bg-muted/30 hover:bg-muted/50 hover:shadow-sm"
										}`}
										onClick={() => setTheme("light")}
									>
										<div className="flex items-center gap-2">
											<Sun className="h-3 w-3 text-yellow-500" />
											<span className="text-xs font-medium">Light</span>
										</div>
										<input 
											type="radio" 
											name="theme" 
											value="light" 
											className="w-3 h-3" 
											checked={theme === "light"}
											onChange={() => setTheme("light")}
										/>
									</div>
									<div 
										className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
											theme === "dark" 
												? "bg-primary/10 border border-primary/20 shadow-sm" 
												: "bg-muted/30 hover:bg-muted/50 hover:shadow-sm"
										}`}
										onClick={() => setTheme("dark")}
									>
										<div className="flex items-center gap-2">
											<Moon className="h-3 w-3 text-blue-500" />
											<span className="text-xs font-medium">Dark</span>
										</div>
										<input 
											type="radio" 
											name="theme" 
											value="dark" 
											className="w-3 h-3" 
											checked={theme === "dark"}
											onChange={() => setTheme("dark")}
										/>
									</div>
									<div 
										className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
											theme === "system" 
												? "bg-primary/10 border border-primary/20 shadow-sm" 
												: "bg-muted/30 hover:bg-muted/50 hover:shadow-sm"
										}`}
										onClick={() => setTheme("system")}
									>
										<div className="flex items-center gap-2">
											<Monitor className="h-3 w-3 text-gray-500" />
											<span className="text-xs font-medium">System</span>
										</div>
										<input 
											type="radio" 
											name="theme" 
											value="system" 
											className="w-3 h-3" 
											checked={theme === "system"}
											onChange={() => setTheme("system")}
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Account Status Card - Compact */}
						<Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2">
									<div className="p-1.5 rounded-lg bg-orange-500/10">
										<Shield className="h-4 w-4 text-orange-500" />
									</div>
									<div>
										<CardTitle className="text-base font-semibold">Account Status</CardTitle>
										<CardDescription className="text-xs">
											Your account information and status
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-2 pb-3">
								<div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
									<span className="text-xs font-medium">Account Type</span>
									<Badge variant="outline" className="text-xs">
										{user?.authProvider === "google" ? "Google" : "Email"}
									</Badge>
								</div>
								<div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
									<span className="text-xs font-medium">Account Status</span>
									<Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
										Active
									</Badge>
								</div>
								<div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
									<span className="text-xs font-medium">Subscription</span>
									<Badge variant="outline" className="text-xs">
										{user?.subscription || "Free"}
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Danger Zone Card - Compact with delete functionality */}
						<Card className="border border-destructive/20 bg-destructive/5">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2">
									<div className="p-1.5 rounded-lg bg-destructive/10">
										<Trash2 className="h-4 w-4 text-destructive" />
									</div>
									<div>
										<CardTitle className="text-base font-semibold text-destructive">Danger Zone</CardTitle>
										<CardDescription className="text-destructive/70 text-xs">
											Permanent actions that cannot be undone
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pb-3">
								<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
									<p className="text-xs text-destructive/80 mb-3">
										Once you delete your account, there is no going back. Please be certain.
									</p>
									<Button
										onClick={() => setIsDeleteDialogOpen(true)}
										className="w-full px-3 py-2 text-xs font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
									>
										Delete Account
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-12 pt-8 border-t border-border/50">
					<div className="text-center text-sm text-muted-foreground">
						<p>
							Need help? Contact our support team or check our{" "}
							<a href="/faqs" className="text-primary hover:underline">
								FAQ section
							</a>
						</p>
					</div>
				</div>
			</div>

			{/* Delete Account Dialog */}
			<Dialog
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={() => {
					if (user?.id) {
						handleDelete({ userId: user.id });
					} else {
						showErrorToast("User ID is missing.");
					}
				}}
				open={isDeleteDialogOpen}
				title="Delete Account"
				description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
				onCancel={() => setIsDeleteDialogOpen(false)}
				confirmText="Delete Account"
				cancelText="Cancel"
			/>
		</div>
	);
};

export default ProfileSettings;
