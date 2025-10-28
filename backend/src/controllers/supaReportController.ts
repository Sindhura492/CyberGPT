import {
	uploadReportAndGetUrl,
	downloadPdfReportFile,
	deletePDF,
} from "../utils/supabaseUtils/reports";
import type { Context } from "hono";

// Upload Endpoint

export const uploadReport = async (c: Context) => {
	try {
		const { file } = await c.req.parseBody();
		if (!(file instanceof File)) {
			return c.json({ error: "Invalid file uploaded" }, 400);
		}

		const publicUrl = await uploadReportAndGetUrl(file);

		if (!publicUrl) {
			return c.json({ error: "Failed to upload the file" }, 500);
		}

		return c.json({ message: "File uploaded successfully", publicUrl }, 200);
	} catch (err) {
		return c.json({ error: "Internal Server Error" }, 500);
	}
};

// Download Endpoint

export const downloadReport = async (c: Context) => {
	const fileName = c.req.param("fileName");

	if (!fileName) {
		return c.json({ error: "Filename is required" }, 400);
	}

	try {
		const fileBlob = await downloadPdfReportFile(fileName);
		return new Response(fileBlob, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${fileName}"`,
			},
		});
	} catch (err) {
		return c.json({ error: "Report not found or deleted already" }, 404);
	}
};

// Delete Endpoint

export const deleteReport = async (c: Context) => {
	const fileName = c.req.param("fileName");

	if (!fileName) {
		return c.json({ error: "Filename is required" }, 400);
	}

	try {
		const deleteResult = await deletePDF(fileName);

		if (!deleteResult) {
			return c.json({ error: "Failed to delete the file" }, 500);
		}

		return c.json({ message: "File deleted successfully" }, 200);
	} catch (err) {
		return c.json({ error: "Internal Server Error" }, 500);
	}
};
