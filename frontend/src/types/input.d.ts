import type { z } from "zod";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export type InputType = "text" | "email" | "password" | "number" | "otp";

export interface FieldType {
	name: string;
	type: InputType;
	placeholder?: string;
	validation: z.ZodTypeAny;
	maxLength?: number;
}

export interface DynamicFormProps<T extends FieldValues> {
	fields: FieldType[];
	onSubmit: (data: T) => Promise<void>;
	submitButton: {
		displayName: string;
		disabled: boolean;
	};
}

export interface DynamicInputProps<T extends FieldValues> {
	field: FieldType & {
		onChange: (value: string | string[]) => void;
		value: string | string[];
	};
	formState: UseFormReturn<T>["formState"];
}
