import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    Table,
} from "@/components/ui/table";
import { AppDispatch, type RootState, type Villas } from "@/types";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    File,
    MoreHorizontal,
    PlusCircle,
    Home,
    Edit,
    Trash2,
    Eye,
    AlertTriangle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { VillaModal } from "./modals/villa-modal";
import {
    editVilla,
    getVillas,
    postVilla,
    deleteVilla,
    getVillaById,
    getVillaSummaries,
} from "@/redux/user/userSlice";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

function Villas() {
    const dispatch = useDispatch<AppDispatch>();
    const { villas, loading } = useSelector(
        (state: RootState) => state.user
    );

    const [filter, setFilter] = useState("");
    const [occupancyFilter, setOccupancyFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [villaToEdit, setVillaToEdit] = useState<Villas | null>(null);
    const [villaToDelete, setVillaToDelete] = useState<Villas | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedVilla, setSelectedVilla] = useState<any>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const { toast } = useToast();

    const itemsPerPage = 20;

    // Load villas on component mount
    useEffect(() => {
        dispatch(getVillaSummaries());
    }, [dispatch]);

    const filteredVillas = villas.filter((villa) => {
        const matchesSearch =
            villa.villaNumber.toLowerCase().includes(filter.toLowerCase()) ||
            villa.residentName?.toLowerCase().includes(filter.toLowerCase()) ||
            "";

        const matchesOccupancy =
            occupancyFilter === "ALL" ||
            villa.occupancyType === occupancyFilter;

        return matchesSearch && matchesOccupancy;
    });
    
    const totalPages = Math.ceil(filteredVillas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVillas = filteredVillas.slice(startIndex, endIndex);

    // Stats for summary cards
    const stats = useMemo(() => {
        const total = villas.length;
        const occupied = villas.filter(
            (v) => v.occupancyType && v.occupancyType !== "VACANT"
        ).length;
        const vacant = villas.filter(
            (v) => !v.occupancyType || v.occupancyType === "VACANT"
        ).length;
        const owners = villas.filter((v) => v.occupancyType === "OWNER").length;
        const tenants = villas.filter(
            (v) => v.occupancyType === "TENANT"
        ).length;

        return { total, occupied, vacant, owners, tenants };
    }, [villas]);

    const handleAddVilla = () => {
        setVillaToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditVilla = (villa: Villas) => {
        setVillaToEdit(villa);
        setIsModalOpen(true);
    };

    const handleSaveVilla = async (villaData: Villas) => {
        try {
            let res;
            if (villaData.id !== 0) {
                res = await dispatch(editVilla(villaData)).unwrap();
            } else {
                res = await dispatch(postVilla(villaData)).unwrap();
            }

            if (res.error) {
                toast({
                    title: "Error",
                    description: res.error,
                    variant: "destructive",
                });
                return;
            }

            // ✅ Use getVillaSummaries instead of getVillas
            await dispatch(getVillaSummaries());
            toast({
                title: "Villa Saved",
                description: `Villa ${villaData.villaNumber} saved successfully`,
            });
            setIsModalOpen(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.error || "Failed to save villa",
                variant: "destructive",
            });
        }
    };

    const confirmDelete = async () => {
        if (!villaToDelete) return;

        try {
            const res = await dispatch(deleteVilla(villaToDelete.id)).unwrap();

            if (res.error) {
                toast({
                    title: "Delete Failed",
                    description: res.error,
                    variant: "destructive",
                });
                return;
            }

            // ✅ Use getVillaSummaries instead of getVillas
            await dispatch(getVillaSummaries());
            toast({
                title: "Villa Deleted",
                description: `Villa ${villaToDelete.villaNumber} deleted successfully`,
            });
            setIsDeleteDialogOpen(false);
            setVillaToDelete(null);
        } catch (error: any) {
            toast({
                title: "Delete Failed",
                description: error.error || "Failed to delete villa",
                variant: "destructive",
            });
        }
    };
    const handleDeleteVilla = (villa: Villas) => {
        setVillaToDelete(villa);
        setIsDeleteDialogOpen(true);
    };

    const handleViewVilla = async (villa: Villas) => {
        try {
            const res = await dispatch(getVillaById(villa.id)).unwrap();
            setSelectedVilla(res.data);
            setIsViewDialogOpen(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load villa details",
                variant: "destructive",
            });
        }
    };

    const getOccupancyBadge = (occupancyType: string | null) => {
        switch (occupancyType) {
            case "OWNER":
                return <Badge variant="default">Owner</Badge>;
            case "TENANT":
                return <Badge variant="secondary">Tenant</Badge>;
            case "VACANT":
            default:
                return <Badge variant="outline">Vacant</Badge>;
        }
    };

    return (
        <div className="container px-4 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Home className="h-8 w-8" />
                        Villa Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage villa properties and resident information
                    </p>
                </div>
                <Button onClick={handleAddVilla} disabled={loading}>
                    <PlusCircle className="h-4 w-4 mr-2"  color="white"/>
                    Add Villa
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Total Villas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {stats.occupied}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Occupied
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-gray-600">
                            {stats.vacant}
                        </div>
                        <p className="text-xs text-muted-foreground">Vacant</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.owners}
                        </div>
                        <p className="text-xs text-muted-foreground">Owners</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.tenants}
                        </div>
                        <p className="text-xs text-muted-foreground">Tenants</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center gap-4 mb-6">
                <Input
                    placeholder="Search by villa number or resident name..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={occupancyFilter}
                    onValueChange={setOccupancyFilter}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Occupancy Types</SelectItem>
                        <SelectItem value="OWNER">Owners Only</SelectItem>
                        <SelectItem value="TENANT">Tenants Only</SelectItem>
                        <SelectItem value="VACANT">Vacant Only</SelectItem>
                    </SelectContent>
                </Select>
                
            </div>

            {/* Villas Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Villas</CardTitle>
                    <CardDescription>
                        Showing {currentVillas.length} of{" "}
                        {filteredVillas.length} villas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {currentVillas.length === 0 ? (
                        <div className="text-center py-12">
                            <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                No Villas Found
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {filter || occupancyFilter !== "ALL"
                                    ? "No villas match your current filters."
                                    : "Get started by adding your first villa."}
                            </p>
                            {!filter && occupancyFilter === "ALL" && (
                                <Button onClick={handleAddVilla}>
                                    <PlusCircle className="h-4 w-4 mr-2 " color="white"/>
                                    Add Your First Villa
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Villa Number</TableHead>
                                    <TableHead>Resident Name</TableHead>
                                    <TableHead>Occupancy</TableHead>
                                    <TableHead>Total Pending</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentVillas.map((villa) => (
                                    <TableRow key={villa.id}>
                                        <TableCell className="font-medium">
                                            {villa.villaNumber}
                                        </TableCell>
                                        <TableCell>
                                            {villa.residentName || (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getOccupancyBadge(
                                                villa.occupancyType
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={
                                                    villa.totalPending &&
                                                    villa.totalPending > 0
                                                        ? "text-red-600 font-medium"
                                                        : ""
                                                }
                                            >
                                                PKR{" "}
                                                {villa.totalPending?.toLocaleString() ||
                                                    "0"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {villa.createdAt
                                                    ? new Date(
                                                          villa.createdAt
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>
                                                        Actions
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleViewVilla(
                                                                villa
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleEditVilla(
                                                                villa
                                                            )
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Villa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {/* <AddPaymentDialog
                                                    /> */}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleDeleteVilla(
                                                                villa
                                                            )
                                                        }
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

                {totalPages > 1 && (
                    <CardFooter className="flex flex-col items-center gap-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(prev - 1, 1)
                                            )
                                        }
                                        className={
                                            currentPage === 1
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            onClick={() =>
                                                setCurrentPage(i + 1)
                                            }
                                            isActive={currentPage === i + 1}
                                            className="cursor-pointer"
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(prev + 1, totalPages)
                                            )
                                        }
                                        className={
                                            currentPage === totalPages
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>

            {/* Villa Modal */}
            <VillaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveVilla}
                villaToEdit={villaToEdit}
                loading={loading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Delete Villa
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete villa "
                            {villaToDelete?.villaNumber}"? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Delete Villa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Villa Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Villa Details - {selectedVilla?.villaNumber}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedVilla && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">
                                        Villa Number
                                    </Label>
                                    <p className="text-lg">
                                        {selectedVilla.villaNumber}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">
                                        Occupancy Type
                                    </Label>
                                    <div className="mt-1">
                                        {getOccupancyBadge(
                                            selectedVilla.occupancyType
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">
                                        Resident Name
                                    </Label>
                                    <p>
                                        {selectedVilla.residentName ||
                                            "No resident"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">
                                        Created Date
                                    </Label>
                                    <p>
                                        {new Date(
                                            selectedVilla.createdAt
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {selectedVilla.payments &&
                                selectedVilla.payments.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Recent Payments
                                        </Label>
                                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                            {selectedVilla.payments
                                                .slice(0, 5)
                                                .map((payment: any) => (
                                                    <div
                                                        key={payment.id}
                                                        className="flex justify-between items-center p-2 bg-muted rounded"
                                                    >
                                                        <div>
                                                            <p className="font-medium">
                                                                {
                                                                    payment
                                                                        .category
                                                                        .name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(
                                                                    payment.paymentDate
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <p className="font-medium">
                                                            PKR{" "}
                                                            {payment.receivedAmount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Villas;
