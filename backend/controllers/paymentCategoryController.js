import { PaymentCategoryModel } from "../models/paymentCategoryModel.js";

export class PaymentCategoryController {
    
    static async getAllCategories(req, res) {
        try {
            const year = req.query.year ? parseInt(req.query.year) : null;
            const categories = await PaymentCategoryModel.getAll(year);

            res.status(200).json({
                message: "success",
                data: categories,
            });
        } catch (error) {
            console.error("Error fetching payment categories:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get category by ID
    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await PaymentCategoryModel.getById(id);

            if (!category) {
                return res.status(404).json({
                    error: "Payment category not found",
                });
            }

            res.status(200).json({
                message: "success",
                data: category,
            });
        } catch (error) {
            console.error("Error fetching payment category:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Create new payment category
    static async createCategory(req, res) {
        try {
            const { name, description, isRecurring } = req.body;

            // Validate required fields
            if (!name) {
                return res.status(400).json({
                    error: "Category name is required",
                });
            }

            const category = await PaymentCategoryModel.create({
                name,
                description,
                isRecurring: isRecurring || false,
            });

            res.status(201).json({
                message: "success",
                data: category,
            });
        } catch (error) {
            console.error("Error creating payment category:", error);

            // Handle unique constraint violation
            if (error.code === "P2002") {
                return res.status(400).json({
                    error: "Payment category with this name already exists",
                });
            }

            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Update payment category
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, description, isRecurring } = req.body;

            // Check if category exists
            const existingCategory = await PaymentCategoryModel.getById(id);
            if (!existingCategory) {
                return res.status(404).json({
                    error: "Payment category not found",
                });
            }

            const category = await PaymentCategoryModel.update(id, {
                name,
                description,
                isRecurring,
            });

            res.status(200).json({
                message: "success",
                data: category,
            });
        } catch (error) {
            console.error("Error updating payment category:", error);

            // Handle unique constraint violation
            if (error.code === "P2002") {
                return res.status(400).json({
                    error: "Payment category with this name already exists",
                });
            }

            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Delete payment category (soft delete)
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;

            // Check if category exists
            const existingCategory = await PaymentCategoryModel.getById(id);
            if (!existingCategory) {
                return res.status(404).json({
                    error: "Payment category not found",
                });
            }

            await PaymentCategoryModel.delete(id);

            res.status(200).json({
                message: "success",
                data: { message: "Payment category deleted successfully" },
            });
        } catch (error) {
            console.error("Error deleting payment category:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }
}
