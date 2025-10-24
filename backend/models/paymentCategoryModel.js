import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class PaymentCategoryModel {
    // Get all payment categories with optional year filter for non-recurring ones
    static async getAll(year = null) {
        const where = {
            isActive: true,
        };

        // If year is provided, filter non-recurring categories by creation year
        if (year) {
            const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
            const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

            return await prisma.paymentCategory.findMany({
                where: {
                    isActive: true,
                    OR: [
                        // Always include recurring categories
                        { isRecurring: true },
                        // Include non-recurring only if created in the specified year
                        {
                            isRecurring: false,
                            createdAt: {
                                gte: startOfYear,
                                lte: endOfYear,
                            },
                        },
                    ],
                },
                orderBy: {
                    name: "asc",
                },
            });
        }

        // If no year specified, return all active categories
        return await prisma.paymentCategory.findMany({
            where,
            orderBy: {
                name: "asc",
            },
        });
    }

    // Get category by ID
    static async getById(id) {
        return await prisma.paymentCategory.findUnique({
            where: { id: parseInt(id) },
        });
    }

    // Create new category
    static async create(data) {
        return await prisma.paymentCategory.create({
            data: {
                name: data.name,
                description: data.description,
                isRecurring: data.isRecurring || false,
            },
        });
    }

    // Update category
    static async update(id, data) {
        return await prisma.paymentCategory.update({
            where: { id: parseInt(id) },
            data,
        });
    }

    // Delete category (soft delete)
    static async delete(id) {
        return await prisma.paymentCategory.update({
            where: { id: parseInt(id) },
            data: { isActive: false },
        });
    }


}
