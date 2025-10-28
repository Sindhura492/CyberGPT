import type React from "react";
import type {
	FieldValues,
	ControllerRenderProps,
	DefaultValues,
} from "react-hook-form";

import { Button } from "@components/ui/button";
import { Form, FormField } from "@components/ui/form";
import type { DynamicFormProps, FieldType } from "../../types/input";
import { DynamicInput } from "./dynamic-inputs";
import { useDynamicForm } from "../../hooks/dynamic-form-hook";
import { useEffect } from "react";

export default function DynamicForm<T extends FieldValues>({
	fields,
	onSubmit,
	submitButton,
}: DynamicFormProps<T>): React.ReactElement {
	const form = useDynamicForm<T>(fields);

	// Reset form state whenever the fields change
	useEffect(() => {
		const defaultValues = fields.reduce(
			(acc, field) => {
				acc[field.name] = ""; // Reset all fields to empty values
				return acc;
			},
			{} as DefaultValues<T>,
		);
		form.reset(defaultValues);
	}, [fields, form]);

	const handleSubmit = async (data: T) => {
		try {
			await onSubmit(data);
		} finally {
			// This is added because when user clicked on submit button again n again the toaster is shown many times
			form.reset();
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-4"
			>
				{fields.map((field: FieldType) => (
					<FormField
						key={field.name}
						control={form.control}
						name={field.name as keyof T}
						render={({
							field: formField,
						}: { field: ControllerRenderProps<T> }) => (
							<DynamicInput
								field={{
									...field,
									...formField,
									value: formField.value ?? "",
								}}
								formState={form.formState}
							/>
						)}
					/>
				))}
				<Button
					type="submit"
					className="w-full"
					disabled={submitButton.disabled}
				>
					{submitButton.displayName}
				</Button>
			</form>
		</Form>
	);
}
