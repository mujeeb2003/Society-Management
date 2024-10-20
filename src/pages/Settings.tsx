import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { backupDatabase, updateUserInfo, changePassword } from "@/redux/user/userSlice";
import { AppDispatch, type RootState } from "@/types";
import axios from "axios";

export default function SettingsPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.user);
    const { toast } = useToast();

    const [userInfo, setUserInfo] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    });

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        try {
            await dispatch(updateUserInfo({...userInfo,id:user.id})).unwrap();
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while updating your profile.",
                variant: "destructive",
            });
        }
    };

    const handlePasswordUpdate = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        try {
            await dispatch(changePassword({
                id: user.id,
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            })).unwrap();
            toast({
                title: "Password updated",
                description: "Your password has been updated successfully.",
            });
            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while updating your password.",
                variant: "destructive",
            });
        }
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
                                        {user.firstName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button variant="outline">Change Avatar</Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={userInfo.firstName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={userInfo.lastName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={userInfo.email}
                                    onChange={handleInputChange}
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
                                <Label htmlFor="currentPassword">
                                    Current Password
                                </Label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    value={passwords.currentPassword}
                                    onChange={handlePasswordChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">
                                    New Password
                                </Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    Confirm New Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChange}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handlePasswordUpdate}>Update Password</Button>
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