import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table"
import { AppDispatch, type RootState, type Villas } from "@/types"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { File, MoreHorizontal, PlusCircle } from 'lucide-react'
import { useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { VillaModal } from "./modals/villa-modal"
import { editVilla, getVillas, postVilla } from "@/redux/user/userSlice"
import { useToast } from "@/hooks/use-toast"
import AddPaymentDialog from "./dialogs/AddPaymentDialog"

function Villas() {
  const dispatch = useDispatch<AppDispatch>()
  const { villas, payments, paymentHeads } = useSelector((state: RootState) => state.user)

  const [filter, setFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [villaToEdit, setVillaToEdit] = useState<Villas | null>(null)
  const { toast } = useToast()

  const itemsPerPage = 20

  const villasWithPayments = useMemo(() => {
    return villas.map(villa => {
      const villaPayments = payments.find(p => p.id === villa.id)?.Payments || []
      const totalPending = villaPayments.reduce((total, payment) => {
        const paymentHead = paymentHeads.find(head => head.id === payment.payment_head_id)
        return total + (paymentHead ? paymentHead.amount - payment.latest_payment : 0)
      }, 0)
      return { ...villa, totalPending }
    })
  }, [villas, payments, paymentHeads])

  const filteredHouses = villasWithPayments.filter(house => 
    house.villa_number.toLowerCase().includes(filter.toLowerCase()) ||
    house.resident_name?.toLowerCase().includes(filter.toLowerCase())
  )

  const totalPages = Math.ceil(filteredHouses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHouses = filteredHouses.slice(startIndex, endIndex)

  const handleAddVilla = () => {
    setVillaToEdit(null)
    setIsModalOpen(true)
  }

  const handleEditVilla = (villa: Villas) => {
    setVillaToEdit(villa)
    setIsModalOpen(true)
  }

  const handleSaveVilla = async (villa: Villas) => {
    let res
    if (villa.id !== 0) {
      res = await dispatch(editVilla(villa))
    } else {
      res = await dispatch(postVilla(villa))
    }
    if (!res.payload.data.id) {
      toast({ title: "Error", description: `Try again later` })
      return setIsModalOpen(false)
    }
    dispatch(getVillas())
    toast({ title: "Villa Saved", description: `Villa ${villa.villa_number} saved successfully` })    
    setIsModalOpen(false)
  }

  return (
    <div className="p-6 text-foreground min-h-screen">
      <h1 className="text-3xl font-bold mb-6 pl-7">Houses Overview</h1>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex items-center mb-4 gap-4">
          <Input
            placeholder="Filter by villa number or resident name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={handleAddVilla}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add House</span>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Houses</CardTitle>
            <CardDescription>Manage houses and view their details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Villa Number</TableHead>
                  <TableHead>Resident Name</TableHead>
                  <TableHead>Occupancy Type</TableHead>
                  <TableHead>Total Pending</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentHouses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell className="font-medium">{house.villa_number}</TableCell>
                    <TableCell>{house.resident_name ? house.resident_name : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={house.occupancy_type === "owner" ? "default" : "secondary"}>
                        {house.occupancy_type ? house.occupancy_type : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>PKR {house.totalPending?.toLocaleString() || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditVilla(house)}>Edit</DropdownMenuItem>
                          <AddPaymentDialog villaId={house.id} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{currentHouses.length}</strong> of <strong>{filteredHouses.length}</strong> houses
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    isActive={currentPage === 1}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    isActive={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </main>
      <VillaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVilla}
        villaToEdit={villaToEdit}
      />
    </div>
  )
}

export default Villas