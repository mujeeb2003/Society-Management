import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class VillaModel {
    // Get all villas
    static async getAll() {
        return await prisma.villa.findMany({
            orderBy: {
                villaNumber: "asc",
            },
        });
    }

    // Get villa by ID
    static async getById(id) {
        // ✅ Ensure ID is properly converted and validated
        // console.log(id);
        const villaId = parseInt(id);
        if (isNaN(villaId)) {
            throw new Error("Invalid villa ID");
        }

        return await prisma.villa.findUnique({
            where: { id: villaId },
            include: {
                payments: {
                    include: {
                        category: true,
                    },
                    orderBy: {
                        paymentDate: "desc",
                    },
                    take: 10, // Only get recent 10 payments
                },
            },
        });
    }

    // Create new villa
    static async create(data) {
        return await prisma.villa.create({
            data: {
                villaNumber: data.villaNumber,
                residentName: data.residentName,
                occupancyType: data.occupancyType,
            },
        });
    }

    // Update villa
    static async update(id, data) {
        return await prisma.villa.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
            },
        });
    }

    // Delete villa
    static async delete(id) {
        return await prisma.villa.delete({
            where: { id: parseInt(id) },
        });
    }

    // Get occupied villas only
    static async getOccupied() {
        return await prisma.villa.findMany({
            where: {
                occupancyType: {
                    in: ["OWNER", "TENANT"],
                },
                residentName: {
                    not: null,
                },
            },
            orderBy: {
                villaNumber: "asc",
            },
        });
    }
}
