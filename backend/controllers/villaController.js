import { VillaModel } from "../models/villaModel.js";
import {PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class VillaController {
    // Get all villas
    static async getAllVillas(req, res) {
        try {
            const villas = await VillaModel.getAll();

            res.status(200).json({
                message: "success",
                data: villas,
            });
        } catch (error) {
            console.error("Error fetching villas:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get villa by ID
    static async getVillaById(req, res) {
        try {
            const { id } = req.params;
            const villa = await VillaModel.getById(id);

            if (!villa) {
                return res.status(404).json({
                    error: "Villa not found",
                });
            }

            res.status(200).json({
                message: "success",
                data: villa,
            });
        } catch (error) {
            console.error("Error fetching villa:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Create new villa
    static async createVilla(req, res) {
        try {
            const { villaNumber, residentName, occupancyType } = req.body;

            // Validate required fields
            if (!villaNumber) {
                return res.status(400).json({
                    error: "Villa number is required",
                });
            }

            const villa = await VillaModel.create({
                villaNumber,
                residentName,
                occupancyType: occupancyType || "VACANT",
            });

            res.status(201).json({
                message: "success",
                data: villa,
            });
        } catch (error) {
            console.error("Error creating villa:", error);

            // Handle unique constraint violation
            if (error.code === "P2002") {
                return res.status(400).json({
                    error: "Villa number already exists",
                });
            }

            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Update villa
    static async updateVilla(req, res) {
        try {
            const { id } = req.params;
            const { villaNumber, residentName, occupancyType } = req.body;

            // Check if villa exists
            const existingVilla = await VillaModel.getById(id);
            if (!existingVilla) {
                return res.status(404).json({
                    error: "Villa not found",
                });
            }

            const villa = await VillaModel.update(id, {
                villaNumber,
                residentName,
                occupancyType,
            });

            res.status(200).json({
                message: "success",
                data: villa,
            });
        } catch (error) {
            console.error("Error updating villa:", error);

            // Handle unique constraint violation
            if (error.code === "P2002") {
                return res.status(400).json({
                    error: "Villa number already exists",
                });
            }

            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Delete villa (we can make this a soft delete if needed)
    static async deleteVilla(req, res) {
        try {
            const { id } = req.params;

            // Check if villa exists
            const existingVilla = await VillaModel.getById(id);
            if (!existingVilla) {
                return res.status(404).json({
                    error: "Villa not found",
                });
            }

            await VillaModel.delete(id);

            res.status(200).json({
                message: "success",
                data: { message: "Villa deleted successfully" },
            });
        } catch (error) {
            console.error("Error deleting villa:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get occupied villas only
    static async getOccupiedVillas(req, res) {
        try {
            const villas = await VillaModel.getOccupied();

            res.status(200).json({
                message: "success",
                data: villas,
            });
        } catch (error) {
            console.error("Error fetching occupied villas:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    static async getVillaSummaries(req, res) {
        try {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;

            // Get all villas with their payment data
            const villas = await prisma.villa.findMany({
                where: { isActive: true },
                include: {
                    payments: {
                        where: {
                            paymentYear: currentYear,
                            paymentMonth: {
                                lte: currentMonth,
                            },
                        },
                        include: {
                            category: true,
                        },
                    },
                },
                orderBy: { id: "asc" },
            });

            // Get standard maintenance amount from recent payments (fallback to 4000)
            const standardMaintenancePayment = await prisma.payment.findFirst({
                where: {
                    category: {
                        isRecurring: true,
                        name: { contains: "Maintenance" }
                    }
                },
                orderBy: { paymentDate: 'desc' }
            });

            const standardAmount = standardMaintenancePayment 
                ? parseFloat(standardMaintenancePayment.receivableAmount) 
                : 4000; // Default fallback

            // Calculate summaries for each villa
            const villaSummaries = villas.map((villa) => {
                let totalPending = 0;
                let totalPaid = 0;

                // For active (non-vacant) villas, calculate expected payments
                if (villa.occupancyType && villa.occupancyType !== 'VACANT') {
                    // Calculate for each month from January to current month
                    for (let month = 1; month <= currentMonth; month++) {
                        const payment = villa.payments.find(
                            (p) =>
                                p.paymentMonth === month &&
                                p.paymentYear === currentYear
                        );

                        const paidAmount = payment
                            ? parseFloat(payment.receivedAmount)
                            : 0;

                        // Use the payment's receivable amount if available, otherwise use standard
                        const expectedAmount = payment 
                            ? parseFloat(payment.receivableAmount)
                            : standardAmount;

                        totalPaid += paidAmount;

                        if (paidAmount < expectedAmount) {
                            totalPending += (expectedAmount - paidAmount);
                        }
                    }
                }

                return {
                    id: villa.id,
                    villaNumber: villa.villaNumber,
                    residentName: villa.residentName,
                    occupancyType: villa.occupancyType,
                    createdAt: villa.createdAt,
                    updatedAt: villa.updatedAt,
                    totalPending: Math.max(0, totalPending), // Ensure non-negative
                    totalPaid,
                    lastPaymentDate:
                        villa.payments.length > 0
                            ? villa.payments.sort(
                                  (a, b) =>
                                      new Date(b.paymentDate) -
                                      new Date(a.paymentDate)
                              )[0].paymentDate
                            : null,
                };
            });

            res.status(200).json({
                message: "success",
                data: villaSummaries,
            });
        } catch (error) {
            console.error("Error fetching villa summaries:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }
}
