import { UserController } from "../controllers/userController.js";
import { Router } from "express";
const userRouter = Router();

// Authentication routes
userRouter.post("/register", UserController.register);
userRouter.post("/login", UserController.login);
userRouter.get("/logout", UserController.logout);

// User management routes
// userRouter.get("/", UserController.getAllUsers);
userRouter.get("/:id", UserController.getUserById);
userRouter.put("/:id", UserController.updateUser);
userRouter.put("/:id/password", UserController.changePassword);

export default userRouter;
