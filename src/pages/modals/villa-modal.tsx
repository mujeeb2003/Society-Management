import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Home } from "lucide-react";
import type { Villas } from "@/types";

type VillaModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (villa: Villas) => void;
    villaToEdit?: Villas | null;
    loading?: boolean;
};

export function VillaModal({
    isOpen,
    onClose,
    onSave,
    villaToEdit,
    loading = false,
}: VillaModalProps) {
    const [villa, setVilla] = useState<Villas>({
        id: 0,
        villaNumber: "",
        residentName: "",
        occupancyType: "VACANT",
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (villaToEdit) {
            setVilla({ ...villaToEdit });
        } else {
            setVilla({
                id: 0,
                villaNumber: "",
                residentName: "",
                occupancyType: "VACANT",
            });
        }
        setErrors({});
    }, [villaToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVilla((prev) => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleOccupancyChange = (value: string) => {
        setVilla((prev) => ({
            ...prev,
            occupancyType: value,
            // Clear resident name if setting to vacant
            residentName: value === "VACANT" ? "" : prev.residentName,
        }));

        if (errors.occupancyType) {
            setErrors((prev) => ({ ...prev, occupancyType: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!villa.villaNumber?.trim()) {
            newErrors.villaNumber = "Villa number is required";
        }

        if (villa.occupancyType !== "VACANT" && !villa.residentName?.trim()) {
            newErrors.residentName =
                "Resident name is required for occupied villas";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        onSave({
            ...villa,
            villaNumber: villa.villaNumber.trim(),
            residentName: villa.residentName?.trim() || null,
        });
    };

    const handleClose = () => {
        if (!loading) {
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[500px]"
                aria-describedby="villa-dialog-description"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        {villaToEdit ? "Edit Villa" : "Add New Villa"}
                    </DialogTitle>
                    <DialogDescription id="villa-dialog-description">
                        {villaToEdit
                            ? "Update the villa information below."
                            : "Enter the details for the new villa."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="villaNumber">
                            Villa Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="villaNumber"
                            name="villaNumber"
                            value={villa.villaNumber}
                            onChange={handleChange}
                            placeholder="e.g., R-001, Villa-25"
                            disabled={loading}
                            className={
                                errors.villaNumber ? "border-red-500" : ""
                            }
                        />
                        {errors.villaNumber && (
                            <span className="text-sm text-red-500">
                                {errors.villaNumber}
                            </span>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="occupancyType">
                            Occupancy Type{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={villa.occupancyType || "VACANT"}
                            onValueChange={handleOccupancyChange}
                            disabled={loading}
                        >
                            <SelectTrigger
                                className={
                                    errors.occupancyType ? "border-red-500" : ""
                                }
                            >
                                <SelectValue placeholder="Select occupancy type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VACANT">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        Vacant
                                    </div>
                                </SelectItem>
                                <SelectItem value="OWNER">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Owner
                                    </div>
                                </SelectItem>
                                <SelectItem value="TENANT">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Tenant
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.occupancyType && (
                            <span className="text-sm text-red-500">
                                {errors.occupancyType}
                            </span>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="residentName">
                            Resident Name
                            {villa.occupancyType !== "VACANT" && (
                                <span className="text-red-500">*</span>
                            )}
                        </Label>
                        <Input
                            id="residentName"
                            name="residentName"
                            value={villa.residentName || ""}
                            onChange={handleChange}
                            placeholder={
                                villa.occupancyType === "VACANT"
                                    ? "No resident (villa is vacant)"
                                    : "Enter resident name"
                            }
                            disabled={
                                loading || villa.occupancyType === "VACANT"
                            }
                            className={
                                errors.residentName ? "border-red-500" : ""
                            }
                        />
                        {errors.residentName && (
                            <span className="text-sm text-red-500">
                                {errors.residentName}
                            </span>
                        )}
                        {villa.occupancyType === "VACANT" && (
                            <span className="text-xs text-muted-foreground">
                                Resident name is not required for vacant villas
                            </span>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {villaToEdit ? "Updating..." : "Creating..."}
                            </>
                        ) : villaToEdit ? (
                            "Update Villa"
                        ) : (
                            "Create Villa"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
