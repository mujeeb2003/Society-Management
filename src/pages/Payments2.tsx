import { useState, useMemo } from 'react'
import {Link} from "react-router-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface Resident {
  id: number;
  villaNumber: string;
  name: string;
  type: string;
}

interface PaymentData {
  [year: number]: {
    [month: number]: {
      [residentId: number]: {
        paid: number;
        pending: number;
      };
    };
  };
}

// Mock data for demonstration
const residents: Resident[] = [
  { id: 1, villaNumber: 'R-02', name: 'N/A', type: 'N/A' },
  { id: 2, villaNumber: 'R-03', name: 'MR. ADEEL', type: 'OWNER' },
  { id: 3, villaNumber: 'R-04', name: 'MS. SARAH', type: 'TENANT' },
]

const paymentData: PaymentData = {
  2023: {
    1: { 
      1: { paid: 0, pending: 0 }, 
      2: { paid: 3000, pending: 2000 }, 
      3: { paid: 2000, pending: 0 } 
    },
    2: { 
      1: { paid: 0, pending: 0 }, 
      2: { paid: 0, pending: 5000 }, 
      3: { paid: 2000, pending: 0 } 
    },
    // ... other months
  },
  2024: {
    1: { 
      1: { paid: 0, pending: 0 }, 
      2: { paid: 3000, pending: 2000 }, 
      3: { paid: 0, pending: 2000 } 
    },
    2: { 
      1: { paid: 0, pending: 0 }, 
      2: { paid: 0, pending: 5000 }, 
      3: { paid: 2000, pending: 0 } 
    },
    3: { 
      1: { paid: 0, pending: 0 }, 
      2: { paid: 2000, pending: 0 }, 
      3: { paid: 2000, pending: 0 } 
    },
    // ... other months
  },
}

export default function PaymentTable() {
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [villaFilter, setVillaFilter] = useState<string>('')
  const [nameFilter, setNameFilter] = useState<string>('')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const calculateTotalOutstanding = (residentId: number): number => {
    return Object.values(paymentData[selectedYear] || {}).reduce((total, month) => total + (month[residentId]?.pending || 0), 0)
  }

  const filteredResidents = useMemo(() => {
    return residents.filter(resident => 
      resident.villaNumber.toLowerCase().includes(villaFilter.toLowerCase()) &&
      resident.name.toLowerCase().includes(nameFilter.toLowerCase())
    )
  }, [villaFilter, nameFilter])

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:px-6">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-0">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/home">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/home/payments">Payments</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold">Payment Management</h2>
          <div className="flex items-center space-x-2">
            <Button size="icon" onClick={() => setSelectedYear(prev => prev - 1)} disabled={selectedYear <= 2023}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" onClick={() => setSelectedYear(prev => prev + 1)} disabled={selectedYear >= 2025}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex space-x-2 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by Villa Number"
              value={villaFilter}
              onChange={(e) => setVillaFilter(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by Resident Name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Payments for {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center" rowSpan={2}>S.NO</TableHead>
                  <TableHead className="text-center" rowSpan={2}>VILLA NUMBER</TableHead>
                  <TableHead className="text-center" rowSpan={2}>NAME OF RESIDENTS</TableHead>
                  <TableHead className="text-center" rowSpan={2}>OWNER / TENANT</TableHead>
                  <TableHead className="text-center" colSpan={2}>NEW WATER CONNECTION 5000/-</TableHead>
                  <TableHead className="text-center" colSpan={2}>NEW WATER CONNECTION 2000/-</TableHead>
                  <TableHead className="text-center" colSpan={2}>Mar-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>Apr-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>May-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>Jun-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>Jul-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>Aug-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>Sep-24</TableHead>
                  <TableHead className="text-center" colSpan={2}>Oct-24</TableHead>
                  <TableHead className="text-center" rowSpan={2}>TOTAL PENDING PAYMENT</TableHead>
                </TableRow>
                <TableRow>
                  {['PAYMENT RECEIVED', 'PAYMENT PENDING'].map((header, index) => (
                    Array(10).fill(null).map((_, i) => (
                      <TableHead key={`${header}-${i}`} className="text-center whitespace-nowrap px-2 py-1 text-xs">
                        {header}
                      </TableHead>
                    ))
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { sno: 1, villa: 'R-02', name: 'N/A', status: 'N/A', payments: Array(20).fill('N/A'), total: 'N/A' },
                  { sno: 2, villa: 'R-03', name: 'MR. ADEEL', status: 'OWNER', payments: [5000, 0, 2000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 0, 4000], total: 0 },
                  { sno: 3, villa: 'R-04', name: 'MR. TAHA SHAIKH', status: 'OWNER', payments: [5000, 0, 2000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 4000, 0, 0, 4000], total: 0 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{row.sno}</TableCell>
                    <TableCell className="text-center">{row.villa}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-center">{row.status}</TableCell>
                    {row.payments.map((payment, i) => (
                      <TableCell key={i} className="text-center px-2 py-1">
                        {payment === 0 ? '-' : payment}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}