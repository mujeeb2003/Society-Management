import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState, type PaymentCategory } from "@/types";
import {
    getPaymentCategories,
    createPaymentCategory,
    updatePaymentCategory,
    deletePaymentCategory,
} from "@/redux/user/userSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Tag, Calendar, AlertTriangle } from "lucide-react";

export default function PaymentCategoriesManagement() {
    const dispatch = useDispatch<AppDispatch>();
    const { paymentCategories, loading } = useSelector(
        (state: RootState) => state.user
    );
    const { toast } = useToast();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newCategory, setNewCategory] = useState<Partial<PaymentCategory>>({
        name: "",
        description: "",
        isRecurring: false,
    });

    const [editingCategory, setEditingCategory] =
        useState<PaymentCategory | null>(null);
    const [deletingCategory, setDeletingCategory] =
        useState<PaymentCategory | null>(null);

    useEffect(() => {
        dispatch(getPaymentCategories());
    }, [dispatch]);

    const resetNewCategory = () => {
        setNewCategory({
            name: "",
            description: "",
            isRecurring: false,
        });
    };

    const handleInputChange = (
        field: keyof PaymentCategory,
        value: string | boolean
    ) => {
        setNewCategory((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleEditInputChange = (
        field: keyof PaymentCategory,
        value: string | boolean
    ) => {
        if (editingCategory) {
            setEditingCategory((prev) =>
                prev
                    ? {
                          ...prev,
                          [field]: value,
                      }
                    : null
            );
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newCategory.name?.trim()) {
            toast({
                title: "Validation Error",
                description: "Category name is required.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await dispatch(
                createPaymentCategory({
                    name: newCategory.name.trim(),
                    description: newCategory.description?.trim() || "",
                    isRecurring: newCategory.isRecurring || false,
                })
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Failed to create category",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Category Created",
                description: `${newCategory.name} has been created successfully.`,
            });

            resetNewCategory();
            setIsCreateDialogOpen(false);
            dispatch(getPaymentCategories());
        } catch (error: any) {
            toast({
                title: "Failed to create category",
                description: error.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingCategory || !editingCategory.name?.trim()) {
            toast({
                title: "Validation Error",
                description: "Category name is required.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await dispatch(
                updatePaymentCategory({
                    id: editingCategory.id,
                    name: editingCategory.name.trim(),
                    description: editingCategory.description?.trim() || "",
                    isRecurring: editingCategory.isRecurring,
                })
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Failed to update category",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Category Updated",
                description: `${editingCategory.name} has been updated successfully.`,
            });

            setIsEditDialogOpen(false);
            setEditingCategory(null);
            dispatch(getPaymentCategories());
        } catch (error: any) {
            toast({
                title: "Failed to update category",
                description: error.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCategory) return;

        try {
            const response = await dispatch(
                deletePaymentCategory(deletingCategory.id)
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Failed to delete category",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Category Deleted",
                description: `${deletingCategory.name} has been deleted successfully.`,
            });

            setIsDeleteDialogOpen(false);
            setDeletingCategory(null);
            dispatch(getPaymentCategories());
        } catch (error: any) {
            toast({
                title: "Failed to delete category",
                description: error.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (category: PaymentCategory) => {
        setEditingCategory({ ...category });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (category: PaymentCategory) => {
        setDeletingCategory(category);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="container px-4 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Tag className="h-8 w-8" />
                        Payment Categories
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage different types of payments and fees
                    </p>
                </div>

                <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" color="white" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Payment Category</DialogTitle>
                            <DialogDescription>
                                Add a new payment category for villa residents.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Category Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newCategory.name || ""}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g., Maintenance Fee, Security Deposit"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={newCategory.description || ""}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Optional description of this payment category"
                                        disabled={loading}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isRecurring"
                                        checked={
                                            newCategory.isRecurring || false
                                        }
                                        onCheckedChange={(checked) =>
                                            handleInputChange(
                                                "isRecurring",
                                                checked
                                            )
                                        }
                                        disabled={loading}
                                    />
                                    <Label
                                        htmlFor="isRecurring"
                                        className="flex items-center gap-2"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Recurring Payment
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Recurring payments are charged monthly
                                    (e.g., maintenance fees)
                                </p>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading
                                        ? "Creating..."
                                        : "Create Category"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        All Payment Categories
                        <Badge variant="secondary" className="ml-2">
                            {paymentCategories.length} categories
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {paymentCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                No Payment Categories
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by creating your first payment
                                category.
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Category
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {category.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs truncate text-muted-foreground">
                                                {category.description ||
                                                    "No description"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    category.isRecurring
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className="flex items-center gap-1 w-fit"
                                            >
                                                <Calendar className="w-3 h-3" color={category.isRecurring ? "white" : "black"}/>
                                                {category.isRecurring
                                                    ? "Recurring"
                                                    : "One-time"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(
                                                    category.createdAt
                                                ).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEditDialog(category)
                                                    }
                                                    disabled={loading}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openDeleteDialog(
                                                            category
                                                        )
                                                    }
                                                    disabled={loading}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Payment Category</DialogTitle>
                        <DialogDescription>
                            Update the payment category information.
                        </DialogDescription>
                    </DialogHeader>
                    {editingCategory && (
                        <form onSubmit={handleEditSubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">
                                        Category Name *
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={editingCategory.name || ""}
                                        onChange={(e) =>
                                            handleEditInputChange(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="edit-description"
                                        value={
                                            editingCategory.description || ""
                                        }
                                        onChange={(e) =>
                                            handleEditInputChange(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        disabled={loading}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="edit-isRecurring"
                                        checked={editingCategory.isRecurring}
                                        onCheckedChange={(checked) =>
                                            handleEditInputChange(
                                                "isRecurring",
                                                checked
                                            )
                                        }
                                        disabled={loading}
                                    />
                                    <Label
                                        htmlFor="edit-isRecurring"
                                        className="flex items-center gap-2"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Recurring Payment
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading
                                        ? "Updating..."
                                        : "Update Category"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Delete Payment Category
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "
                            {deletingCategory?.name}"? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Delete Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
