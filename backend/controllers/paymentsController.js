import { PaymentModel } from "../models/paymentModel.js";

export class PaymentsController {
    // Get all payments in the format expected by the frontend
    static async getAllPayments(req, res) {
        try {
            const payments = await PaymentModel.getAllWithVillaStructure();

            res.status(200).json({
                message: "success",
                data: payments,
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get payments with filters (for date range, villa, category)
    static async getFilteredPayments(req, res) {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                villaId: req.query.villaId,
                categoryId: req.query.categoryId,
            };

            const payments = await PaymentModel.getAll(filters);

            res.status(200).json({
                message: "success",
                data: payments,
            });
        } catch (error) {
            console.error("Error fetching filtered payments:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Create new payment
    static async createPayment(req, res) {
        try {
            const {
                villaId,
                categoryId,
                receivableAmount,
                receivedAmount,
                paymentDate,
                paymentMonth,
                paymentYear,
                paymentMethod,
                notes,
            } = req.body;

            // console.log(req.body);
            // Validate required fields
            if (
                !villaId ||
                !categoryId ||
                // !receivableAmount ||
                // !receivedAmount ||
                !paymentDate ||
                !paymentMonth ||
                !paymentYear
            ) {
                return res.status(400).json({
                    error: "Required fields: villaId, categoryId, receivableAmount, receivedAmount, paymentDate, paymentMonth, paymentYear",
                });
            }

            // Validate that received amount doesn't exceed receivable amount for new payments
            if (parseFloat(receivedAmount) > parseFloat(receivableAmount)) {
                return res.status(400).json({
                    error: "Received amount cannot exceed receivable amount",
                });
            }

            const payment = await PaymentModel.create({
                villaId,
                categoryId,
                receivableAmount,
                receivedAmount,
                paymentDate,
                paymentMonth,
                paymentYear,
                paymentMethod: paymentMethod || "CASH",
                notes,
            });

            res.status(201).json({
                message: "success",
                data: payment,
            });
        } catch (error) {
            console.error("Error creating payment:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get payments by villa (for individual villa analysis)
    static async getPaymentsByVilla(req, res) {
        try {
            const { villaId } = req.params;
            const filters = {
                year: req.query.year,
                categoryId: req.query.categoryId,
            };

            const payments = await PaymentModel.getByVilla(villaId, filters);

            res.status(200).json({
                message: "success",
                data: payments,
            });
        } catch (error) {
            console.error("Error fetching payments by villa:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get payment summary for date range
    static async getPaymentsSummary(req, res) {
        try {
            // console.log(req.query);
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: "Start date and end date are required",
                });
            }

            const summary = await PaymentModel.getSummaryByDateRange(
                startDate,
                endDate
            );

            res.status(200).json({
                message: "success",
                data: summary,
            });
        } catch (error) {
            console.error("Error fetching payment summary:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get payment statistics
    static async getPaymentStatistics(req, res) {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };

            const statistics = await PaymentModel.getPaymentStatistics(filters);

            res.status(200).json({
                message: "success",
                data: statistics,
            });
        } catch (error) {
            console.error("Error fetching payment statistics:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Update payment
    static async updatePayment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate that received amount doesn't exceed receivable amount
            if (updateData.receivableAmount && updateData.receivedAmount) {
                if (
                    parseFloat(updateData.receivedAmount) >
                    parseFloat(updateData.receivableAmount)
                ) {
                    return res.status(400).json({
                        error: "Received amount cannot exceed receivable amount",
                    });
                }
            }

            const payment = await PaymentModel.update(id, updateData);

            res.status(200).json({
                message: "success",
                data: payment,
            });
        } catch (error) {
            console.error("Error updating payment:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Delete payment
    static async deletePayment(req, res) {
        try {
            const { id } = req.params;

            await PaymentModel.delete(id);

            res.status(200).json({
                message: "success",
                data: { message: "Payment deleted successfully" },
            });
        } catch (error) {
            console.error("Error deleting payment:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get pending maintenance payments for a villa (for receipt)
    static async getPendingMaintenancePayments(req, res) {
        try {
            const { villaId } = req.params;

            if (!villaId) {
                return res.status(400).json({
                    error: "Villa ID is required",
                });
            }

            const pendingPayments = await PaymentModel.getPendingMaintenancePayments(villaId);

            res.status(200).json({
                message: "success",
                data: pendingPayments,
            });
        } catch (error) {
            console.error("Error fetching pending maintenance payments:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }
}
