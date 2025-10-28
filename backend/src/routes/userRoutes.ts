import { Hono } from "hono";
import {
	changePassword,
	deleteUserById,
	getUserById,
	requestReset,
	resetPassword,
	updateAvatarById,
	updateUserById,
	verifyOtp,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const userRoutes = new Hono();

userRoutes.get("/user/:id", authMiddleware, getUserById);
userRoutes.put("/user/edit/:id", authMiddleware, updateUserById);
userRoutes.delete("/user/delete/:id", authMiddleware, deleteUserById);
userRoutes.post("/user/reset/:id", authMiddleware, resetPassword);
userRoutes.post("/user/reset_req", requestReset);
userRoutes.post("/user/verify", verifyOtp);
userRoutes.post("/user/resetpass", resetPassword);
userRoutes.put("/user/change_password/:id", authMiddleware, changePassword);
userRoutes.put("/user/avatar/:id", authMiddleware, updateAvatarById);

export { userRoutes };
