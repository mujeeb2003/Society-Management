import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSelector, useDispatch} from "react-redux";
import { AppDispatch, type RootState } from "@/types"
import { userLogin, userSignup } from "@/redux/user/userSlice"

export const description =
  "A sign up form with first name, last name, email and password inside a card. There's an option to sign up with GitHub and a link to login if you already have an account"

export function SignupForm() {
  // const { user, loading} = useSelector((state:RootState)=>state.user);
  const dispatch = useDispatch<AppDispatch>();

  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setformData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
    const {name,value} = e.target;
    setformData({...formData,[name]:value});
  }

  const handleSubmit = async () => {
    console.log(JSON.stringify(formData,null,4));

    try {
      const response = await dispatch(userSignup(formData));

      if(response.payload.error) {
        toast({ title: "User Signup",description: response.payload.error })
        return;
      }

      toast({ title: "User Signup",description: `User signed up successfully, ${response.payload.data.email}` })
      navigate('/');

    } catch (error:any) {
      toast({ title: "User Signup",description: error.message })
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-black overflow-y-hidden">
        <Card className="mx-auto max-w-sm">
        <CardHeader>
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>
            Enter your information to create an account
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" name="firstName" placeholder="Max" required 
                onChange={(e)=>handleChange(e)}/>
                </div>
                <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" name="lastName" placeholder="Robinson" required 
                onChange={(e)=>handleChange(e)}/>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                name="email"
                required
                onChange={(e)=>handleChange(e)}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" required minLength={6}
                onChange={(e)=>handleChange(e)} 
                onKeyDown={(e)=>{if(e.key === "Enter") handleSubmit()}}
                />
            </div>
            <Button type="submit" className="w-full" onClick={handleSubmit}>
                Create an account
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/" className="underline">
                Sign in
            </Link>
            </div>
        </CardContent>
        </Card>
    </div>
  )
}

