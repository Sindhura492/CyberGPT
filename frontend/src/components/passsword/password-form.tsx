import { useState } from "react";
import { Eye, EyeOff, Lock, Shield, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@components/ui/label";
import { passwordSchema } from "./constants";
import type { FieldValues } from "react-hook-form";
import { Loader2 } from "lucide-react";

import {
	Form,
	FormItem,
	FormControl,
	FormField,
	FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { handleVisibilityToggle, handleSubmit } from "./actions";
import type { PasswordValues } from "./constants";

const PasswordForm = () => {
	const form = useForm<PasswordValues>({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});
	const [isLoading, setIsLoading] = useState(false);

	const [passwordVisibility, setPasswordVisibility] = useState({
		currentPassword: false,
		newPassword: false,
		confirmPassword: false,
	});

	return (
		<div className="space-y-6">
			{/* Security Info */}
			<div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
				<Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
				<div className="space-y-1 min-w-0">
					<h3 className="font-medium text-sm text-blue-900 dark:text-blue-100">
						Password Security
					</h3>
					<p className="text-xs text-blue-700 dark:text-blue-300">
						Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
					</p>
				</div>
			</div>

			{/* Password Form */}
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((data) =>
						handleSubmit(data, form, setIsLoading),
					)}
					className="space-y-6"
				>
					{/* Current Password */}
					<FormField
						control={form.control}
						name="currentPassword"
						render={({ field }: { field: FieldValues }) => (
							<FormItem>
								<Label htmlFor="currentPassword" className="text-sm font-medium">
									Current Password
								</Label>
								<FormControl>
									<div className="relative">
										<Input
											type={
												passwordVisibility.currentPassword
													? "text"
													: "password"
											}
											id="currentPassword"
											placeholder="Enter your current password"
											className="h-10 pr-10"
											value={field.value ?? ""}
											{...field}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											aria-label="Toggle current password visibility"
											onClick={() =>
												handleVisibilityToggle(
													"currentPassword",
													setPasswordVisibility,
												)
											}
										>
											{passwordVisibility.currentPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* New Password */}
					<FormField
						control={form.control}
						name="newPassword"
						render={({ field }: { field: FieldValues }) => (
							<FormItem>
								<Label htmlFor="newPassword" className="text-sm font-medium">
									New Password
								</Label>
								<FormControl>
									<div className="relative">
										<Input
											type={
												passwordVisibility.newPassword
													? "text"
													: "password"
											}
											id="newPassword"
											placeholder="Enter your new password"
											className="h-10 pr-10"
											value={field.value ?? ""}
											{...field}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											aria-label="Toggle new password visibility"
											onClick={() =>
												handleVisibilityToggle(
													"newPassword",
													setPasswordVisibility,
												)
											}
										>
											{passwordVisibility.newPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Confirm Password */}
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }: { field: FieldValues }) => (
							<FormItem>
								<Label htmlFor="confirmPassword" className="text-sm font-medium">
									Confirm New Password
								</Label>
								<FormControl>
									<div className="relative">
										<Input
											type={
												passwordVisibility.confirmPassword
													? "text"
													: "password"
											}
											id="confirmPassword"
											placeholder="Confirm your new password"
											className="h-10 pr-10"
											value={field.value ?? ""}
											{...field}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											aria-label="Toggle confirm password visibility"
											onClick={() =>
												handleVisibilityToggle(
													"confirmPassword",
													setPasswordVisibility,
												)
											}
										>
											{passwordVisibility.confirmPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Password Requirements */}
					<div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
						<h4 className="font-medium text-sm flex items-center gap-2">
							<Lock className="h-4 w-4" />
							Password Requirements
						</h4>
						<div className="grid gap-2 text-xs">
							<div className="flex items-center gap-2">
								<CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
								<span>At least 8 characters long</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
								<span>Contains uppercase and lowercase letters</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
								<span>Includes numbers and special characters</span>
							</div>
						</div>
					</div>

					{/* Submit Button */}
					<div className="pt-4 border-t border-border/50">
						<Button
							className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5"
							type="submit"
							variant="default"
							disabled={
								isLoading ||
								Object.keys(form.formState.errors).length > 0 ||
								(!form.formState.isDirty && !form.formState.isSubmitting)
							}
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Lock className="h-4 w-4" />
							)}
							Update Password
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default PasswordForm;
