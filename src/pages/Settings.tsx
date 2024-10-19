import { createElement, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, Database } from "lucide-react";
import { backupDatabase } from "@/redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, type RootState } from "@/types";

export default function SettingsPage() {
    const dispatch = useDispatch<AppDispatch>();
    const {user} = useSelector((state:RootState) => state.user);
    // console.log(JSON.stringify(user,null,4))
    // const [user, setUser] = useState({
    //     name: "John Doe",
    //     email: "john.doe@example.com",
    //     bio: "I'm a software developer passionate about creating amazing user experiences.",
    //     avatar: "/placeholder-avatar.jpg",
    // });
    const { toast } = useToast();

    // const handleInputChange = (
    //     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    // ) => {
    //     const { name, value } = e.target;
    //     setUser((prevUser) => ({
    //         ...prevUser,
    //         [name]: value,
    //     }));
    // };

    const handleSave = () => {
        // Here you would typically make an API call to save the user's settings
        console.log("Saving user settings:", user);
        toast({
            title: "Settings saved",
            description: "Your settings have been saved successfully.",
        });
    };

    const handleBackupDatabase = async () => {
        try {
            await dispatch(backupDatabase());
            toast({
                title: "Database backup initiated",
                description: "Your database backup has been initiated successfully.",
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "An error occurred while initiating the database backup.",
                variant: "destructive",
            });
        }

    };

    return (
        <div className="container px-4 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Lock className="w-4 h-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="backup">
                        <Database className="w-4 h-4 mr-2" />
                        Backup
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Manage your public profile information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage
                                        // src={user.avatar}
                                        alt={user.firstName}
                                    />
                                    <AvatarFallback>
                                        {/* {user.firstName.charAt(0)} */}
                                    </AvatarFallback>
                                </Avatar>
                                <Button variant="outline">Change Avatar</Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">First Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={user.firstName}
                                    // onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Last Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={user.lastName}
                                    // onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={user.email}
                                    // onChange={handleInputChange}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSave}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>
                                Manage your account's security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">
                                    Current Password
                                </Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">
                                    New Password
                                </Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">
                                    Confirm New Password
                                </Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Update Password</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="backup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Database Backup</CardTitle>
                            <CardDescription>
                                Initiate a backup of your database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Click the button below to start a backup of your
                                database. This process may take several minutes
                                depending on the size of your data.
                            </p>
                            <Button onClick={handleBackupDatabase}>
                                <Database className="w-4 h-4 mr-2" />
                                Start Database Backup
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
