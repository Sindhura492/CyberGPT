import supabase from "../../config/supabase";

const bucketName = "avatars";
export async function uploadImageAndGetUrl(file: File): Promise<string | null> {
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
