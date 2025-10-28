import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@components/ui/label";
import { profileSchema, USER_INITIAL_VALUES } from "./constants";
import type { ProfileValues } from "./constants";
import { showErrorToast } from "@components/toaster";
import { Loader2, Save, User, AtSign } from "lucide-react";
import {
	Form,
	FormItem,
	FormControl,
	FormField,
	FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import type { FieldValues } from "react-hook-form";
import useStore from "../../store/store";
import { useState } from "react";
import { Button } from "../ui/button";
import { handleSubmit } from "./profile-actions";
import AvatarUpload from "./AvatarUpload";

const ProfileForm = () => {
	const user = useStore((state) => state.user);
	const token = useStore((state) => state.token);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: user
			? {
					...user,
				}
			: USER_INITIAL_VALUES,
	});

	return (
		<div className="space-y-6">
			{/* Avatar Section */}
			<div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-muted/30 border border-border/50">
				<AvatarUpload userId={user?.id ?? ""} token={token || ""} />
				<div className="text-center">
					<h3 className="font-medium text-sm">Profile Picture</h3>
					<p className="text-xs text-muted-foreground mt-1">
						Click to upload a new image
					</p>
				</div>
			</div>

			{/* Form Section */}
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((data) => {
						if (user) {
							handleSubmit(
								data,
								{ userId: user.id },
								setIsLoading,
							);
						} else {
							showErrorToast("User not found");
						}
					})}
					className="space-y-6"
				>
					{/* Personal Information */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 mb-4">
							<User className="h-4 w-4 text-muted-foreground" />
							<h3 className="font-medium text-sm">Personal Information</h3>
						</div>
						
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="firstName"
								render={({
									field,
								}: { field: FieldValues }) => (
									<FormItem>
										<Label
											htmlFor="firstName"
											className="text-sm font-medium"
										>
											First Name
										</Label>
										<FormControl>
											<Input
												placeholder="Enter your first name"
												className="h-10"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="lastName"
								render={({
									field,
								}: { field: FieldValues }) => (
									<FormItem>
										<Label
											htmlFor="lastName"
											className="text-sm font-medium"
										>
											Last Name
										</Label>
										<FormControl>
											<Input
												placeholder="Enter your last name"
												className="h-10"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Account Information */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 mb-4">
							<AtSign className="h-4 w-4 text-muted-foreground" />
							<h3 className="font-medium text-sm">Account Information</h3>
						</div>
						
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="username"
								render={({
									field,
								}: { field: FieldValues }) => (
									<FormItem>
										<Label
											htmlFor="username"
											className="text-sm font-medium"
										>
											Username
										</Label>
										<FormControl>
											<Input
												placeholder="Choose a username"
												className="h-10"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="email"
								render={({
									field,
								}: { field: FieldValues }) => (
									<FormItem>
										<Label
											htmlFor="email"
											className="text-sm font-medium"
										>
											Email Address
										</Label>
										<FormControl>
											<Input
												placeholder="your.email@example.com"
												type="email"
												className="h-10"
												disabled={
													user?.authProvider ===
													"google"
												}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					{/* Action Button */}
					<div className="pt-6 border-t border-border/50">
						<Button
							className="flex items-center justify-center gap-2 px-6 py-2.5"
							type="submit"
							variant="default"
							disabled={
								isLoading ||
								Object.keys(form.formState.errors).length >
									0 ||
								(!form.formState.isDirty &&
									!form.formState.isSubmitting)
							}
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Save className="h-4 w-4" />
							)}
							Save Changes
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default ProfileForm;
