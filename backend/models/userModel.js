import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export class UserModel {
    static async getByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    static async create(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        return await prisma.user.create({
            data: {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                password: hashedPassword,
            },
        });
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async getById(id) {
        return await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                createdAt: true,
            },
        });
    }

    static async update(id, data) {
        return await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
            },
        });
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        return await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                password: hashedPassword,
            },
        });
    }

    static async getAll() {
        return await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }
}
