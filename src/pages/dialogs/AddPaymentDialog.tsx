import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState, type PaymentHead } from "@/types"
import { postPayment, getPayments} from "@/redux/user/userSlice"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import PaymentReceipt from "@/components/PaymentReceipt"

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

interface AddPaymentDialogProps {
  villaId: number
  // paymentHeads: PaymentHead[]
}

interface FormData {
  amount: number
  paymentMonth: string
  paymentYear: string
  payment_head_id: number
}

export default function AddPaymentDialog({ villaId}: AddPaymentDialogProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    amount: 0,
    paymentMonth: "",
    paymentYear: new Date().getFullYear().toString(),
    payment_head_id: 0
  })
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  
  const { paymentHeads, villas } = useSelector((state: RootState) => state.user)
  const selectedHead = paymentHeads.find(head => head.id === formData.payment_head_id)
  const selectedVilla = villas.find(villa => villa.id === villaId)

  // useEffect(() => {
  //   dispatch(getPaymentHeads())
  // }, [dispatch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedHead && formData.amount > selectedHead.amount) {
      toast({ 
        title: "Invalid amount", 
        description: `Amount cannot exceed ${selectedHead.amount}`,
        variant: "destructive" 
      })
      return
    }

    try {
      const result = await dispatch(postPayment({
        villa_id: villaId,
        payment_head_id: formData.payment_head_id,
        amount: formData.amount,
        payment_date: new Date().toISOString().split("T")[0],
        payment_month: formData.paymentMonth,
        payment_year: formData.paymentYear,
      })).unwrap()
      
      await dispatch(getPayments())
      
      toast({ title: "Payment added successfully" })
      
      setReceiptData({
        villa_number: selectedVilla?.villa_number,
        resident_name: selectedVilla?.resident_name,
        amount: formData.amount,
        paymentMonth: formData.paymentMonth,
        paymentYear: formData.paymentYear,
        payment_head: selectedHead?.name
      })
      setShowReceipt(true)
    } catch (error) {
      toast({ title: "Failed to add payment", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Payment</DialogTitle>
        </DialogHeader>
        {!showReceipt ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_head" className="text-right">
                Payment Head
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.payment_head_id.toString()}
                  onValueChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      payment_head_id: parseInt(value),
                      amount: paymentHeads.find(h => h.id === parseInt(value))?.amount || 0
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Payment Head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Payment Head</SelectLabel>
                      {paymentHeads.map((head) => (
                        <SelectItem
                          value={head.id.toString()}
                          key={head.id}
                        >
                          {head.name} - PKR {head.amount}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                className="col-span-3"
                max={selectedHead?.amount}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-right">
                Month
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.paymentMonth}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, paymentMonth: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Month</SelectLabel>
                      {months.map((month) => (
                        <SelectItem value={month} key={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentYear" className="text-right">
                Year
              </Label>
              <Input
                id="paymentYear"
                name="paymentYear"
                type="number"
                value={formData.paymentYear}
                onChange={handleInputChange}
                className="col-span-3"
                min={2023}
                max={2025}
                required
              />
            </div>

            <Button type="submit" className="w-full">Add Payment</Button>
          </form>
        ) : (
          <div className="space-y-4">
            <PaymentReceipt paymentData={receiptData} />
            <Button onClick={() => {
              setShowReceipt(false)
              setOpen(false)
              setFormData({
                amount: 0,
                paymentMonth: "",
                paymentYear: new Date().getFullYear().toString(),
                payment_head_id: 0
              })
            }} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}