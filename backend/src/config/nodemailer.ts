import * as nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
	host: process.env.NODEMAILER_HOST,
	port: 465,
	secure: true,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});
