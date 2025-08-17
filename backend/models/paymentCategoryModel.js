import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class PaymentCategoryModel {
    // Get all payment categories
    static async getAll() {
        return await prisma.paymentCategory.findMany({
            where: {
                isActive: true,
            },
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
