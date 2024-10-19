// import Link from "next/link"
import {  ArrowUpRight, House} from "lucide-react"
import { Avatar, AvatarImage} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, type Payment, type RootState } from "@/types"
import { useMemo, useState } from "react"

export const description =
  "An application shell with a header and main content area. The header has a navbar, a search input and and a user nav dropdown. The user nav is toggled by a button with an avatar image. The main content area is divided into two rows. The first row has a grid of cards with statistics. The second row has a grid of cards with a table of recent transactions and a list of recent sales."

export function Dashboard() {
  const { payments, villas } = useSelector((state:RootState)=>state.user);
  const dispatch = useDispatch<AppDispatch>();
  const [sortedPayments, setSortedPayments] = useState<Payment[]>([]);
  const [pendingPayments, setpendingPayments] = useState<{ownerName:string,pendingAmount:number}[]>([]);

  useMemo(() => {
      const latestPayments = payments.map((payment) => {

        const latestPaymentDate = new Date(
          Math.max(...payment.Payments.map((p) => new Date(p.latest_payment_date).getTime()))
        );
        return { ...payment, latestPaymentDate };
      });
  
      const sortPayments = latestPayments.sort(
        (a, b) => a.latestPaymentDate.getTime() - b.latestPaymentDate.getTime()
      );
  
      setSortedPayments(sortPayments);

      const pendingPayment = payments.map((payment,index)=>{
        const pendingAmount = payment.Payments.reduce((acc,payment)=>acc + ( payments[index].Payable  - payment.latest_payment),0);
        return {ownerName:payment.resident_name,pendingAmount:pendingAmount}
      })
      setpendingPayments(pendingPayment);

  }, [dispatch , payments])
  


  return (
    <div className="flex min-h-screen w-full flex-col">

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        
        <div className="grid gap-4 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payment Received 
              </CardTitle>
              <span className="h-4 w-4 text-muted-foreground">PKR</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {payments.map((payment)=>payment.Payments.reduce((acc,payment)=>acc+payment.latest_payment,0)).reduce((acc,payment)=>acc+payment,0)} /-</div>
              <p className="text-xs text-muted-foreground">
                Amount payed this month
              </p>
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payment Pending 
              </CardTitle>
              <span className="h-4 w-4 text-muted-foreground">PKR</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {(payments.map((payment,index)=>payment.Payments.reduce((acc,payment)=>acc + (payments[index].Payable - payment.latest_payment), 0)).reduce((acc,payment)=>acc+payment,0))} /-</div>
              <p className="text-xs text-muted-foreground">
                Amount pending this month
              </p>
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
              <House className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{villas.length}</div>
              <p className="text-xs text-muted-foreground">
                Total houses
              </p>
            </CardContent>
          </Card>


          {/* <Card x-chunk="dashboard-01-chunk-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"></CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">
                +201 since last hour
              </p>
            </CardContent>
          </Card> */}

        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">

          <Card
            className="xl:col-span-2" x-chunk="dashboard-01-chunk-4"
          >
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Payments</CardTitle>
                <CardDescription>
                  Recent Payments from villa owners
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link to="/home/payments">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>House No.</TableHead>
                    {/* <TableHead className="">
                      Type
                    </TableHead> */}
                    <TableHead className="">
                      Status
                    </TableHead>
                    <TableHead className="">
                      Date
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment)=>
                  (
                    <TableRow key={payment.id}>
                      <TableCell className="py-5">
                        <div className="font-medium">{payment.resident_name}</div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="font-medium">{payment.villa_number}</div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge className="text-xs" variant="outline">
                          Paid
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        {payment.Payments[0].latest_payment_date}
                      </TableCell>
                      <TableCell className="text-right">PKR {payment.Payments[0].latest_payment}</TableCell>
                    </TableRow>
                  )
                  )}
                 
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card x-chunk="dashboard-01-chunk-5">
            <CardHeader>
              <CardTitle>Owners list</CardTitle>
              <CardDescription>Top 5 owners with most outstanding payments</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
              {pendingPayments.map((pendingPayment)=>
                <div className="flex items-center gap-4" key={pendingPayment.ownerName}>
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    {/* <AvatarFallback>{pendingPayment?.ownerName?.split(' ')[0].charAt(0)+pendingPayment?.ownerName?.split(' ')[1].charAt(0)}</AvatarFallback> */}
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {pendingPayment.ownerName}
                    </p>
                    {/* <p className="text-sm text-muted-foreground">
                    </p> */}
                  </div>
                  <div className="ml-auto font-medium">+PKR {pendingPayment.pendingAmount}</div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
