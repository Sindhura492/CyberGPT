import supabase from "../../config/supabase";

const bucketName = "reports";
export async function uploadReportAndGetUrl(
	file: File,
): Promise<string | null> {
	try {
		if (!supabase) {
			console.error("Supabase client not configured");
			return null;
		}
		
		const fileName = `${Date.now()}-${file.name}`;

		// Upload the image to the specified bucket
		const { data, error } = await supabase.storage
			.from(bucketName)
			.upload(fileName, file, {
				cacheControl: "3600",
				upsert: true,
			});

		if (error) {
			console.error("Upload error:", error);
			return null;
		}

		// Retrieve the public URL of the uploaded file
		const { data: publicUrlData } = supabase.storage
			.from(bucketName)
			.getPublicUrl(data?.path || "");

		return publicUrlData.publicUrl || null;
	} catch (err) {
		console.error("Unexpected error:", err);
		return null;
	}
}

export async function downloadPdfReportFile(fileName: string): Promise<Blob> {
	try {
		if (!supabase) {
			throw new Error("Supabase client not configured");
		}
		
		const { data, error } = await supabase.storage
			.from("reports")
			.download(fileName);

		if (error) {
			throw new Error("Download error", error);
		}
		return data;
	} catch (err) {
		throw new Error("Unexpected error:");
	}
}

export const deletePDF = async (fileName: string) => {
	try {
		if (!supabase) {
			throw new Error("Supabase client not configured");
		}
		
		const { data, error } = await supabase.storage
			.from(bucketName)
			.remove([fileName]);

		if (error) {
			throw new Error(`Error deleting file: ${error.message}`);
		}
		return data;
	} catch (error) {
		throw new Error("Unexpected error:", error as Error);
	}
};
