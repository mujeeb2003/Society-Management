import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, type RootState } from '@/types';
import { getPayments } from '@/redux/user/userSlice';
import { format } from 'date-fns';
import ViewHistoryDialog from './dialogs/ViewHistoryDialog';
import AddPaymentDialog from './dialogs/AddPaymentDialog';


const Payments: React.FC = () => {
  const { payments } = useSelector((state:RootState)=>state.user);
  const dispatch = useDispatch<AppDispatch>();  // const [villas, setVillas] = useState<Villa[]>([]);
  const [filter, setFilter] = useState('');
  // const [filteredVillas, setFilteredVillas] = useState<Villa[]>([]);


  const filteredData = payments.filter(payments => 
    payments.villa_number.toLowerCase().includes(filter.toLowerCase()) ||
    payments.resident_name.toLowerCase().includes(filter.toLowerCase())
  );


  return (
    <div className="p-6 text-foreground h-screen">
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
            <TableHead className="font-semibold text-center">Villa Number</TableHead>
            <TableHead className="font-semibold text-center">Resident Name</TableHead>
            <TableHead className="font-semibold text-center">Occupancy Type</TableHead>
            <TableHead className="font-semibold text-center">Payable Amount</TableHead>
            <TableHead className="font-semibold text-center">Latest Payment</TableHead>
            <TableHead className="font-semibold text-center">Latest Payment Date</TableHead>
            <TableHead className="font-semibold text-center">Current Month Pending</TableHead> 
            <TableHead className="font-semibold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((payment) => (
            <TableRow key={payment.id} className='text-foreground text-center'>
              <TableCell>{payment.villa_number}</TableCell>
              <TableCell>{payment.resident_name}</TableCell>
              <TableCell>{payment.occupancy_type}</TableCell>
              <TableCell>PKR {payment.Payable} /-</TableCell>
              <TableCell>PKR {payment.Payments[0].latest_payment || 'N/A'} /-</TableCell>
              <TableCell>{format(new Date(payment.Payments[0].latest_payment_date), 'do MMMM yyyy') || 'N/A'}</TableCell>
              <TableCell>PKR {payment.Payable - payment.Payments[0].latest_payment   || '0'} /-</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <ViewHistoryDialog
                    payments={payment}
                  />
                  <AddPaymentDialog
                    villaId={payment.id}
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