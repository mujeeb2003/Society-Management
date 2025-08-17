import { UserModel } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export class UserController {
    static async register(req, res) {
        try {
            const { firstName, lastName, email, password } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !password) {
                return res.status(400).json({
                    error: "All fields are required (firstName, lastName, email, password)",
                });
            }

            // Check if user already exists
            const existingUser = await UserModel.getByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    error: "User with this email already exists",
                });
            }

            // Create new user
            const user = await UserModel.create({
                firstName,
                lastName,
                email,
                password,
            });

            res.status(201).json({
                message: "success",
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            });
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Login user
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    error: "Email and password are required",
                });
            }

            // Find user by email
            const user = await UserModel.getByEmail(email);
            if (!user) {
                return res.status(400).json({
                    error: "User not found",
                });
            }

            // Verify password
            const isMatch = await UserModel.verifyPassword(
                password,
                user.password
            );
            if (!isMatch) {
                return res.status(400).json({
                    error: "Invalid credentials",
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                },
                process.env.JWT_SECRET || "SECRET_KEY",
                { expiresIn: "24h" }
            );

            res.status(200).json({
                message: "success",
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    token: token,
                },
            });
        } catch (error) {
            console.error("Error logging in:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await UserModel.getById(id);

            if (!user) {
                return res.status(404).json({
                    error: "User not found",
                });
            }

            res.status(200).json({
                message: "success",
                data: user,
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }
    
    // Update user
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { firstName, lastName, email } = req.body;

            // Check if user exists
            const existingUser = await UserModel.getById(id);
            if (!existingUser) {
                return res.status(404).json({
                    error: "User not found",
                });
            }

            // Update user
            const updatedUser = await UserModel.update(id, {
                firstName,
                lastName,
                email,
            });

            res.status(200).json({
                message: "User information updated successfully",
                data: {
                    id: updatedUser.id,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                },
            });
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    static async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            // Validate required fields
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: "Current password and new password are required",
                });
            }

            // Get user with password
            const user = await UserModel.getByEmail(
                (
                    await UserModel.getById(id)
                ).email
            );

            if (!user) {
                return res.status(404).json({
                    error: "User not found",
                });
            }

            // Verify current password
            const isMatch = await UserModel.verifyPassword(
                currentPassword,
                user.password
            );
            if (!isMatch) {
                return res.status(400).json({
                    error: "Current password is incorrect",
                });
            }

            // Update password
            await UserModel.updatePassword(id, newPassword);

            res.status(200).json({
                message: "Password updated successfully",
            });
        } catch (error) {
            console.error("Error changing password:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Logout (simple response - token handling is client-side)
    static async logout(req, res) {
        try {
            res.status(200).json({
                message: "success",
                data: { message: "Logged out successfully" },
            });
        } catch (error) {
            res.status(500).json({
                message: "error",
                error: error.message,
            });
        }
    }
}
