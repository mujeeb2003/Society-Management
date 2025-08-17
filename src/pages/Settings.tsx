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
import {
    User,
    Lock,
    Database,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    backupDatabase,
    updateUserInfo,
    changePassword,
} from "@/redux/user/userSlice";
import { AppDispatch, type RootState } from "@/types";

export default function Settings() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.user);
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

    const [backupFormat, setBackupFormat] = useState<"excel" | "pdf">("excel");
    const [backupLoading, setBackupLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        // Validation
        if (
            !userInfo.firstName.trim() ||
            !userInfo.lastName.trim() ||
            !userInfo.email.trim()
        ) {
            toast({
                title: "Validation Error",
                description: "All fields are required.",
                variant: "destructive",
            });
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userInfo.email)) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await dispatch(
                updateUserInfo({ ...userInfo, id: user.id })
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Update Failed",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description:
                    error.error ||
                    "An error occurred while updating your profile.",
                variant: "destructive",
            });
        }
    };

    const handlePasswordUpdate = async () => {
        // Validation
        if (
            !passwords.currentPassword ||
            !passwords.newPassword ||
            !passwords.confirmPassword
        ) {
            toast({
                title: "Validation Error",
                description: "All password fields are required.",
                variant: "destructive",
            });
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "New passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await dispatch(
                changePassword({
                    id: user.id,
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                })
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Password Update Failed",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Password Updated",
                description: "Your password has been updated successfully.",
            });

            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            toast({
                title: "Password Update Failed",
                description:
                    error.error ||
                    "An error occurred while updating your password.",
                variant: "destructive",
            });
        }
    };

    const handleBackupDatabase = async () => {
        setBackupLoading(true);
        try {
            const response = await dispatch(
                backupDatabase(backupFormat)
            ).unwrap();

            toast({
                title: "Backup Completed",
                description:
                    response ||
                    `${backupFormat.toUpperCase()} backup downloaded successfully.`,
            });
        } catch (error: any) {
            toast({
                title: "Backup Failed",
                description:
                    error.error ||
                    "An error occurred while generating the backup.",
                variant: "destructive",
            });
        } finally {
            setBackupLoading(false);
        }
    };

    return (
        <div className="container px-4 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <Badge variant="outline" className="text-sm">
                    Logged in as {user.firstName} {user.lastName}
                </Badge>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
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
                        Data Management
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information and contact
                                details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="w-20 h-20">
                                    <AvatarImage
                                        src="" // Add avatar URL when available
                                        alt={`${user.firstName} ${user.lastName}`}
                                    />
                                    <AvatarFallback className="text-lg">
                                        {user.firstName.charAt(0)}
                                        {user.lastName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Button variant="outline" size="sm">
                                        Change Avatar
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        JPG, GIF or PNG. Max size 2MB.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={userInfo.firstName}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={userInfo.lastName}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={userInfo.email}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    placeholder="Enter email address"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full md:w-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password & Security</CardTitle>
                            <CardDescription>
                                Update your password to keep your account
                                secure.
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
                                    disabled={loading}
                                    placeholder="Enter current password"
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
                                    disabled={loading}
                                    placeholder="Enter new password (min. 6 characters)"
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
                                    disabled={loading}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-medium mb-2">
                                    Password Requirements:
                                </h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• At least 6 characters long</li>
                                    <li>
                                        • Use a combination of letters, numbers,
                                        and symbols
                                    </li>
                                    <li>• Don't reuse your current password</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handlePasswordUpdate}
                                disabled={loading}
                                className="w-full md:w-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="backup">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Database Backup</CardTitle>
                                <CardDescription>
                                    Export your complete database including all
                                    villas, payments, and expenses.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="backup-format">
                                        Export Format
                                    </Label>
                                    <Select
                                        value={backupFormat}
                                        onValueChange={(
                                            value: "excel" | "pdf"
                                        ) => setBackupFormat(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="excel">
                                                <div className="flex items-center">
                                                    <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                                                    Excel (.xlsx) - Complete
                                                    Data
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="pdf">
                                                <div className="flex items-center">
                                                    <FileText className="w-4 h-4 mr-2 text-red-600" />
                                                    PDF (.pdf) - Summary Report
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                    <div className="flex items-start space-x-3">
                                        <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                                What's included in the backup:
                                            </h4>
                                            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                                                <li>
                                                    • All villa information and
                                                    residents
                                                </li>
                                                <li>
                                                    • Complete payment history
                                                    and records
                                                </li>
                                                <li>
                                                    • All expense categories and
                                                    transactions
                                                </li>
                                                <li>
                                                    • Payment categories and
                                                    configurations
                                                </li>
                                                <li>
                                                    • Financial summary and
                                                    statistics
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleBackupDatabase}
                                    disabled={backupLoading}
                                    className="w-full"
                                    size="lg"
                                >
                                    {backupLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating{" "}
                                            {backupFormat.toUpperCase()}{" "}
                                            Backup...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download{" "}
                                            {backupFormat.toUpperCase()} Backup
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Data Management Tips</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Regular Backups
                                        </h4>
                                        <p className="text-muted-foreground">
                                            We recommend taking weekly backups
                                            to ensure your data is always safe.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Excel vs PDF
                                        </h4>
                                        <p className="text-muted-foreground">
                                            Excel format includes all raw data,
                                            while PDF provides a formatted
                                            summary report.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
