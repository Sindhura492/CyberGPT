import React, { useState } from "react";
import type { FieldValues } from "react-hook-form";

import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { FormControl, FormItem, FormMessage } from "@components/ui/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@components/ui/input-otp";

import { Eye, EyeOff } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import type { DynamicInputProps } from "../../types/input";

export const DynamicInput = React.memo(
	<T extends FieldValues>({ field, formState }: DynamicInputProps<T>) => {
		const [showPassword, setShowPassword] = useState(false);

		const renderInput = () => {
			switch (field.type) {
				case "password":
					return (
						<div className="relative">
							<Input
								placeholder={field.placeholder}
								type={showPassword ? "text" : "password"}
								value={field.value as string}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => field.onChange(e.target.value)}
								autoComplete={field.name}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<Eye className="h-4 w-4" />
								) : (
									<EyeOff className="h-4 w-4" />
								)}
							</Button>
						</div>
					);
				case "otp":
					return (
						<div className="flex justify-center">
							<InputOTP
								maxLength={field.maxLength || 6}
								pattern={REGEXP_ONLY_DIGITS}
								value={field.value as string}
								onChange={(value: string) =>
									field.onChange(value)
								}
							>
								<InputOTPGroup>
									{Array.from(
										{ length: field.maxLength || 6 },
										(_, index) => {
											const uniqueKey = `${field.name}-${index}`;
											return (
												<InputOTPSlot
													key={uniqueKey}
													index={index}
												/>
											);
										},
									)}
								</InputOTPGroup>
							</InputOTP>
						</div>
					);
				default:
					return (
						<Input
							placeholder={field.placeholder}
							type={field.type}
							value={field.value as string}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>,
							) => field.onChange(e.target.value)}
						/>
					);
			}
		};

		return (
			<FormItem>
				<FormControl>{renderInput()}</FormControl>
				<FormMessage>
					{formState.errors[field.name]?.message ?? ""}
				</FormMessage>
			</FormItem>
		);
	},
);

DynamicInput.displayName = "DynamicInput";
