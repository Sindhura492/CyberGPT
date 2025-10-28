import { useMemo } from "react";
import { type FieldValues, type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FieldType } from "../types/input";

export function useDynamicForm<T extends FieldValues>(fields: FieldType[]) {
	const schema = useMemo(() => {
		const schemaFields = fields.reduce(
			(acc, field) => {
				acc[field.name] = field.validation;
				return acc;
			},
			{} as Record<string, z.ZodTypeAny>,
		);

		return z.object(schemaFields).refine(
			(data) => {
				if ("password" in data && "confirmPassword" in data) {
					return data.password === data.confirmPassword;
				}
				return true;
			},
			{
				message: "Passwords do not match",
				path: ["confirmPassword"],
			},
		);
	}, [fields]);

	const defaultValues = useMemo(
		() =>
			fields.reduce(
				(acc, field) => {
					acc[field.name] = "";
					return acc;
				},
				{} as DefaultValues<T>,
			),
		[fields],
	);

	const form = useForm<T>({
		resolver: zodResolver(schema),
		defaultValues,
	});

	return form;
}
