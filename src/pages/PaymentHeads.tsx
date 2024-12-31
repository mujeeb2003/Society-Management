import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState, type PaymentHead } from '@/types'
import { getPaymentHeads, postPaymentHead, updatePaymentHead, deletePaymentHead } from '@/redux/user/userSlice'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { useToast } from '@/hooks/use-toast'

export default function PaymentHeadsManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { paymentHeads } = useSelector((state: RootState) => state.user)
  const [newPaymentHead, setNewPaymentHead] = useState<Partial<PaymentHead>>({
    name: '',
    description: '',
    amount: 0,
    is_recurring: false
  })
  const { toast } = useToast()

  useEffect(() => {
    dispatch(getPaymentHeads())
  }, [dispatch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setNewPaymentHead(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setNewPaymentHead(prev => ({ ...prev, is_recurring: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(postPaymentHead(newPaymentHead)).unwrap()
      setNewPaymentHead({ name: '', description: '', amount: 0, is_recurring: false })
      toast({ title: "Payment head added successfully" })
      dispatch(getPaymentHeads());
    } catch (error) {
      toast({ title: "Failed to add payment head", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deletePaymentHead(id)).unwrap()
      toast({ title: "Payment head deleted successfully" })
    } catch (error) {
      toast({ title: "Failed to delete payment head", variant: "destructive" })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto min-h-screen my-6">
      <CardHeader>
        <CardTitle>Manage Payment Heads</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            name="name"
            value={newPaymentHead.name}
            onChange={handleInputChange}
            placeholder="Payment Head Name"
            required
          />
          <Input
            name="description"
            value={newPaymentHead.description}
            onChange={handleInputChange}
            placeholder="Description"
          />
          <Input
            name="amount"
            type="number"
            value={newPaymentHead.amount}
            onChange={handleInputChange}
            placeholder="Amount"
            required
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="is_recurring"
              checked={newPaymentHead.is_recurring}
              onCheckedChange={handleSwitchChange}
            />
            <label htmlFor="is_recurring">Is Recurring</label>
          </div>
          <Button type="submit">Add Payment Head</Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentHeads.map((head) => (
              <TableRow key={head.id}>
                <TableCell>{head.name}</TableCell>
                <TableCell>{head.description}</TableCell>
                <TableCell>{head.amount}</TableCell>
                <TableCell>{head.is_recurring ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button variant="destructive" onClick={() => handleDelete(head.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}