import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { userLogin } from "@/redux/user/userSlice"
import type { AppDispatch } from "@/types"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"

export const description =
  "A simple login form with email and password. The submit button says 'Sign in'."

export function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setformData] = useState({
    email:"",
    password:""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
    const {name,value} = e.target;
    setformData({...formData,[name]:value});
  }
  
  const handleSubmit = async () => {

    try {
      const response = await dispatch(userLogin(formData));

      if(response.payload.error) {
        toast({ title: "User Sign In",description: response.payload.error })
        return;
      }

      toast({ title: "User Sign In",description: `User signed in successfully, ${response.payload.data.email}` })
      navigate('/home');

    } catch (error:any) {
      toast({ title: "User Sign In",description: error.message })
    }
  }


  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" name="email" placeholder="m@example.com" required onChange={(e)=>handleChange(e)}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password"  name="password" required onChange={(e)=>handleChange(e)} onKeyDown={(e)=>{if(e.key=="Enter")handleSubmit()}}/>
          </div>
          <Button className="w-full" onClick={handleSubmit}>Sign in</Button>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>

  )
}

