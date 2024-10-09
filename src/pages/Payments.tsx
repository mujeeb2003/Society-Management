import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Payment {
  villa_id: number;
  payment_month: string;
  payment_year: number;
  amount: number;
  payment_type: string;
  payment_date: string;
}

interface Villa {
  id: number;
  villa_number: string;
  resident_name: string;
  occupancy_type: string;
  latestPayment?: Payment;
}

interface PaymentHistoryDialogProps {
  villaId: number;
  villaNumber: string;
  residentName: string;
}

const PaymentHistoryDialog: React.FC<PaymentHistoryDialogProps> = ({ villaId, villaNumber, residentName }) => {
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

  useEffect(() => {
    fetch(`/api/villas/${villaId}/payments`)
      .then(response => response.json())
      .then(data => setPaymentHistory(data));
  }, [villaId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View History</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">{villaNumber} - {residentName} Payment History</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold">Year</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment, index) => (
                <TableRow key={index} className="text-foreground">
                  <TableCell>{payment.payment_month}</TableCell>
                  <TableCell>{payment.payment_year}</TableCell>
                  <TableCell>₹{payment.amount}</TableCell>
                  <TableCell>{payment.payment_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AddPaymentDialogProps {
  villaId: number;
  onAddPayment: (payment: Payment) => void;
}

const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({ villaId, onAddPayment }) => {
  const [amount, setAmount] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentYear, setPaymentYear] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        villa_id: villaId,
        amount: parseFloat(amount),
        payment_month: paymentMonth,
        payment_year: parseInt(paymentYear),
        payment_type: 'received',
        payment_date: new Date().toISOString().split('T')[0]
      })
    })
    .then(response => response.json())
    .then(data => {
      onAddPayment(data);
      setAmount('');
      setPaymentMonth('');
      setPaymentYear('');
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Add Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="month" className="text-right">Month</Label>
              <Input
                id="month"
                type="text"
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year</Label>
              <Input
                id="year"
                type="number"
                value={paymentYear}
                onChange={(e) => setPaymentYear(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Payments: React.FC = () => {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/villas')
      .then(response => response.json())
      .then(data => setVillas(data));
  }, []);

  const filteredData = villas.filter(villa => 
    villa.villa_number.toLowerCase().includes(filter.toLowerCase()) ||
    villa.resident_name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddPayment = (newPayment: Payment) => {
    setVillas(prevVillas => 
      prevVillas.map(villa => 
        villa.id === newPayment.villa_id
          ? { ...villa, latestPayment: newPayment }
          : villa
      )
    );
  };

  return (
    <div className="p-6 text-foreground">
      <h1 className="text-3xl font-bold mb-6">Payments Overview</h1>
      <div className="flex justify-between items-center mb-4">
        <Input 
          className="max-w-sm" 
          placeholder="Filter by Villa Number or Resident Name" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow className='bg-secondary'>
            <TableHead className="font-semibold">Villa Number</TableHead>
            <TableHead className="font-semibold">Resident Name</TableHead>
            <TableHead className="font-semibold">Occupancy Type</TableHead>
            <TableHead className="font-semibold">Latest Payment</TableHead>
            <TableHead className="font-semibold">Latest Payment Date</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((villa) => (
            <TableRow key={villa.id} className='text-foreground'>
              <TableCell>{villa.villa_number}</TableCell>
              <TableCell>{villa.resident_name}</TableCell>
              <TableCell>{villa.occupancy_type}</TableCell>
              <TableCell>₹{villa.latestPayment?.amount || 'N/A'}</TableCell>
              <TableCell>{villa.latestPayment?.payment_date || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <PaymentHistoryDialog 
                    villaId={villa.id}
                    villaNumber={villa.villa_number} 
                    residentName={villa.resident_name} 
                  />
                  <AddPaymentDialog
                    villaId={villa.id}
                    onAddPayment={handleAddPayment}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Payments;