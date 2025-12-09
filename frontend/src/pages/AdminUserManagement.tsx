// // import { useState } from "react";
// // import { Card } from "../components/ui/card";
// // import { Button } from "../components/ui/button";
// // import { Input } from "../components/ui/input";
// // import { Badge } from "../components/ui/badge";
// // import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "../components/ui/select";
// // import {
// //   Search,
// //   Plus,
// //   MoreVertical,
// //   Mail,
// //   Shield,
// //   Users as UsersIcon,
// //   Edit,
// //   Trash2,
// // } from "lucide-react";

// // interface AdminUserManagementProps {
// //   onLogout: () => void;
// // }

// // export default function UserManagement({ onLogout }: AdminUserManagementProps) {
// //   const [searchQuery, setSearchQuery] = useState("");
// //  const users = [
// //     {
// //       id: 1,
// //       name: "John Don",
// //       email: "johndoe@company.com",
// //       role: "Admin",
// //       branch: "All Branches",
// //       status: "Active",
// //       lastActive: "2 hours ago",
// //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
// //     },
// //     {
// //       id: 2,
// //       name: "Sarah Johnson",
// //       email: "sarah.j@company.com",
// //       role: "Manager",
// //       branch: "Downtown Branch",
// //       status: "Active",
// //       lastActive: "5 minutes ago",
// //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
// //     },
// //     {
// //       id: 3,
// //       name: "Michael Chen",
// //       email: "michael.c@company.com",
// //       role: "Supervisor",
// //       branch: "Westside Branch",
// //       status: "Active",
// //       lastActive: "1 hour ago",
// //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
// //     },
// //     {
// //       id: 4,
// //       name: "Emily Rodriguez",
// //       email: "emily.r@company.com",
// //       role: "Supervisor",
// //       branch: "Eastside Branch",
// //       status: "Active",
// //       lastActive: "3 hours ago",
// //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
// //     },
// //     {
// //       id: 5,
// //       name: "David Kim",
// //       email: "david.k@company.com",
// //       role: "Viewer",
// //       branch: "Downtown Branch",
// //       status: "Active",
// //       lastActive: "1 day ago",
// //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
// //     },
// //     {
// //       id: 6,
// //       name: "Lisa Anderson",
// //       email: "lisa.a@company.com",
// //       role: "Viewer",
// //       branch: "Westside Branch",
// //       status: "Inactive",
// //       lastActive: "7 days ago",
// //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
// //     },
// //   ];

// //   const getRoleColor = (role: string) => {
// //     switch (role) {
// //       case "Admin":
// //         return "bg-purple-100 text-purple-700 border-purple-200";
// //       case "Manager":
// //         return "bg-blue-100 text-blue-700 border-blue-200";
// //       case "Supervisor":
// //         return "bg-green-100 text-green-700 border-green-200";
// //       case "Viewer":
// //         return "bg-slate-100 text-slate-700 border-slate-200";
// //       default:
// //         return "bg-slate-100 text-slate-700 border-slate-200";
// //     }
// //   };

// //   const getStatusColor = (status: string) => {
// //     return status === "Active"
// //       ? "bg-green-100 text-green-700 border-green-200"
// //       : "bg-slate-100 text-slate-700 border-slate-200";
// //   };

// //   const stats = [
// //     {
// //       label: "Total Users",
// //       value: users.length,
// //       icon: UsersIcon,
// //       color: "text-blue-600",
// //       bgColor: "bg-blue-50",
// //     },
// //     {
// //       label: "Active Users",
// //       value: users.filter((u) => u.status === "Active").length,
// //       icon: Shield,
// //       color: "text-green-600",
// //       bgColor: "bg-green-50",
// //     },
// //     {
// //       label: "Admins",
// //       value: users.filter((u) => u.role === "Admin").length,
// //       icon: Shield,
// //       color: "text-purple-600",
// //       bgColor: "bg-purple-50",
// //     },
// //   ];

// //   return (
// //     <div className="p-6 space-y-6">
// //       {/* Page Header */}
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-3xl mb-2">User Management</h1>
// //           <p className="text-slate-600">
// //             Manage team members and their access levels
// //           </p>
// //         </div>
// //         <Button className="bg-blue-600 hover:bg-blue-700">
// //           <Plus className="w-4 h-4 mr-2" />
// //           Add User
// //         </Button>
// //         <Button onClick={onLogout} className="bg-blue-600 hover:bg-blue-700">
// //           <Plus className="w-4 h-4 mr-2" />
// //           Logout
// //         </Button>
// //       </div>

// //       {/* Stats */}
// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //         {stats.map((stat, index) => (
// //           <Card key={index} className="p-6">
// //             <div className="flex items-center justify-between">
// //               <div>
// //                 <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
// //                 <p className="text-3xl">{stat.value}</p>
// //               </div>
// //               <div
// //                 className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
// //               >
// //                 <stat.icon className={`w-6 h-6 ${stat.color}`} />
// //               </div>
// //             </div>
// //           </Card>
// //         ))}
// //       </div>

// //       {/* Filters & Search */}
// //       <Card className="p-6">
// //         <div className="flex flex-wrap gap-4">
// //           <div className="flex-1 min-w-64">
// //             <div className="relative">
// //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
// //               <Input
// //                 placeholder="Search users..."
// //                 className="pl-9"
// //                 value={searchQuery}
// //                 onChange={(e) => setSearchQuery(e.target.value)}
// //               />
// //             </div>
// //           </div>
// //           <Select defaultValue="all-roles">
// //             <SelectTrigger className="w-48">
// //               <SelectValue placeholder="Filter by Role" />
// //             </SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="all-roles">All Roles</SelectItem>
// //               <SelectItem value="admin">Admin</SelectItem>
// //               <SelectItem value="manager">Manager</SelectItem>
// //               <SelectItem value="supervisor">Supervisor</SelectItem>
// //               <SelectItem value="viewer">Viewer</SelectItem>
// //             </SelectContent>
// //           </Select>
// //           <Select defaultValue="all-branches">
// //             <SelectTrigger className="w-48">
// //               <SelectValue placeholder="Filter by Branch" />
// //             </SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="all-branches">All Branches</SelectItem>
// //               <SelectItem value="downtown">Downtown Branch</SelectItem>
// //               <SelectItem value="westside">Westside Branch</SelectItem>
// //               <SelectItem value="eastside">Eastside Branch</SelectItem>
// //             </SelectContent>
// //           </Select>
// //           <Select defaultValue="all-status">
// //             <SelectTrigger className="w-48">
// //               <SelectValue placeholder="Filter by Status" />
// //             </SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="all-status">All Status</SelectItem>
// //               <SelectItem value="active">Active</SelectItem>
// //               <SelectItem value="inactive">Inactive</SelectItem>
// //             </SelectContent>
// //           </Select>
// //         </div>
// //       </Card>

// //       {/* Users List */}
// //       <Card className="p-6">
// //         <div className="mb-6">
// //           <h2 className="text-lg">Team Members</h2>
// //           <p className="text-sm text-slate-600">{users.length} total users</p>
// //         </div>
// //         <div className="space-y-4">
// //           {users.map((user) => (
// //             <div
// //               key={user.id}
// //               className="flex items-center justify-between p-4 rounded-xl border hover:shadow-md transition-shadow"
// //             >
// //               <div className="flex items-center gap-4 flex-1">
// //                 <Avatar className="w-12 h-12">
// //                   <AvatarImage src={user.avatar} />
// //                   <AvatarFallback>
// //                     {user.name
// //                       .split(" ")
// //                       .map((n) => n[0])
// //                       .join("")}
// //                   </AvatarFallback>
// //                 </Avatar>
// //                 <div className="flex-1 min-w-0">
// //                   <div className="flex items-center gap-2 mb-1">
// //                     <h3>{user.name}</h3>
// //                     <Badge
// //                       className={getRoleColor(user.role)}
// //                       variant="outline"
// //                     >
// //                       {user.role}
// //                     </Badge>
// //                     <Badge
// //                       className={getStatusColor(user.status)}
// //                       variant="outline"
// //                     >
// //                       {user.status}
// //                     </Badge>
// //                   </div>
// //                   <div className="flex items-center gap-4 text-sm text-slate-600">
// //                     <span className="flex items-center gap-1">
// //                       <Mail className="w-4 h-4" />
// //                       {user.email}
// //                     </span>
// //                     <span>{user.branch}</span>
// //                     <span>Last active: {user.lastActive}</span>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="flex items-center gap-2">
// //                 <Button variant="ghost" size="sm">
// //                   <Edit className="w-4 h-4" />
// //                 </Button>
// //                 <Button variant="ghost" size="sm">
// //                   <Trash2 className="w-4 h-4 text-red-600" />
// //                 </Button>
// //                 <Button variant="ghost" size="sm">
// //                   <MoreVertical className="w-4 h-4" />
// //                 </Button>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       </Card>

// //       {/* Role Descriptions */}
// //       <Card className="p-6">
// //         <h2 className="text-lg mb-4">Role Permissions</h2>
// //         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
// //           <div className="p-4 rounded-xl border">
// //             <div className="flex items-center gap-2 mb-2">
// //               <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
// //                 <Shield className="w-4 h-4 text-purple-600" />
// //               </div>
// //               <h3>Admin</h3>
// //             </div>
// //             <p className="text-sm text-slate-600">
// //               Full system access including user management and settings
// //             </p>
// //           </div>
// //           <div className="p-4 rounded-xl border">
// //             <div className="flex items-center gap-2 mb-2">
// //               <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
// //                 <Shield className="w-4 h-4 text-blue-600" />
// //               </div>
// //               <h3>Manager</h3>
// //             </div>
// //             <p className="text-sm text-slate-600">
// //               Branch-level access with report generation and analytics
// //             </p>
// //           </div>
// //           <div className="p-4 rounded-xl border">
// //             <div className="flex items-center gap-2 mb-2">
// //               <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
// //                 <Shield className="w-4 h-4 text-green-600" />
// //               </div>
// //               <h3>Supervisor</h3>
// //             </div>
// //             <p className="text-sm text-slate-600">
// //               View and resolve violations for assigned areas
// //             </p>
// //           </div>
// //           <div className="p-4 rounded-xl border">
// //             <div className="flex items-center gap-2 mb-2">
// //               <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
// //                 <Shield className="w-4 h-4 text-slate-600" />
// //               </div>
// //               <h3>Viewer</h3>
// //             </div>
// //             <p className="text-sm text-slate-600">
// //               Read-only access to dashboards and reports
// //             </p>
// //           </div>
// //         </div>
// //       </Card>
// //     </div>
// //   );
// // }
// import { useState } from 'react';
// import { Card } from '../components/ui/card';
// import { Button } from '../components/ui/button';
// import { Input } from '../components/ui/input';
// import { Badge } from '../components/ui/badge';
// import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
// import { Label } from '../components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
// import { Search, Plus, MoreVertical, Mail, Shield, Users as UsersIcon, Clock } from 'lucide-react';

// export default function AdminUserManagement() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     role: '',
//     branch: '',
//     status: 'Active'
//   });

//   const users = [
//     {
//       id: 1,
//       name: 'John Doe',
//       email: 'johndoe@company.com',
//       role: 'Admin',
//       branch: 'All Branches',
//       status: 'Active',
//       lastActive: '2 hours ago',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
//     },
//     {
//       id: 2,
//       name: 'Sarah Johnson',
//       email: 'sarah.j@company.com',
//       role: 'Manager',
//       branch: 'Downtown Branch',
//       status: 'Active',
//       lastActive: '5 minutes ago',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
//     },
//     {
//       id: 3,
//       name: 'Michael Chen',
//       email: 'michael.c@company.com',
//       role: 'Supervisor',
//       branch: 'Westside Branch',
//       status: 'Active',
//       lastActive: '1 hour ago',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
//     },
//     {
//       id: 4,
//       name: 'Emily Rodriguez',
//       email: 'emily.r@company.com',
//       role: 'Supervisor',
//       branch: 'Eastside Branch',
//       status: 'Active',
//       lastActive: '3 hours ago',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'
//     },
//     {
//       id: 5,
//       name: 'David Kim',
//       email: 'david.k@company.com',
//       role: 'Viewer',
//       branch: 'Downtown Branch',
//       status: 'Active',
//       lastActive: '1 day ago',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
//     },
//     {
//       id: 6,
//       name: 'Lisa Anderson',
//       email: 'lisa.a@company.com',
//       role: 'Viewer',
//       branch: 'Westside Branch',
//       status: 'Inactive',
//       lastActive: '7 days ago',
//       avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'
//     },
//   ];

//   const getRoleColor = (role: string) => {
//     switch (role) {
//       case 'Admin':
//         return 'bg-purple-100 text-purple-700 border-purple-200';
//       case 'Manager':
//         return 'bg-blue-100 text-blue-700 border-blue-200';
//       case 'Supervisor':
//         return 'bg-green-100 text-green-700 border-green-200';
//       case 'Viewer':
//         return 'bg-slate-100 text-slate-700 border-slate-200';
//       default:
//         return 'bg-slate-100 text-slate-700 border-slate-200';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     return status === 'Active'
//       ? 'bg-green-100 text-green-700 border-green-200'
//       : 'bg-slate-100 text-slate-700 border-slate-200';
//   };

//   const stats = [
//     { label: 'Total Users', value: users.length, icon: UsersIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' },
//     { label: 'Active Users', value: users.filter(u => u.status === 'Active').length, icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50' },
//     { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, icon: Shield, color: 'text-purple-600', bgColor: 'bg-purple-50' },
//     { label: 'Managers', value: users.filter(u => u.role === 'Manager').length, icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
//   ];

//   const handleAddUser = () => {
//     setSelectedUser(null);
//     setFormData({
//       name: '',
//       email: '',
//       role: '',
//       branch: '',
//       status: 'Active'
//     });
//     setIsDialogOpen(true);
//   };

//   const handleEditUser = (user: any) => {
//     setSelectedUser(user);
//     setFormData({
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       branch: user.branch,
//       status: user.status
//     });
//     setIsDialogOpen(true);
//   };

//   const handleSave = () => {
//     // Save logic here
//     setIsDialogOpen(false);
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl mb-2">User Management</h1>
//           <p className="text-slate-600">Manage team members and their access levels</p>
//         </div>
//         <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddUser}>
//           <Plus className="w-4 h-4 mr-2" />
//           Add User
//         </Button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {stats.map((stat, index) => (
//           <Card key={index} className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
//                 <p className="text-3xl">{stat.value}</p>
//               </div>
//               <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
//                 <stat.icon className={`w-6 h-6 ${stat.color}`} />
//               </div>
//             </div>
//           </Card>
//         ))}
//       </div>

//       {/* Filters & Search */}
//       <Card className="p-6">
//         <div className="flex flex-wrap gap-4">
//           <div className="flex-1 min-w-64">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//               <Input
//                 placeholder="Search users..."
//                 className="pl-9"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//           </div>
//           <Select defaultValue="all-roles">
//             <SelectTrigger className="w-48">
//               <SelectValue placeholder="Filter by Role" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-roles">All Roles</SelectItem>
//               <SelectItem value="admin">Admin</SelectItem>
//               <SelectItem value="manager">Manager</SelectItem>
//               <SelectItem value="supervisor">Supervisor</SelectItem>
//               <SelectItem value="viewer">Viewer</SelectItem>
//             </SelectContent>
//           </Select>
//           <Select defaultValue="all-status">
//             <SelectTrigger className="w-48">
//               <SelectValue placeholder="Filter by Status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all-status">All Status</SelectItem>
//               <SelectItem value="active">Active</SelectItem>
//               <SelectItem value="inactive">Inactive</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </Card>

//       {/* Users Table */}
//       <Card className="p-6">
//         <div className="mb-6">
//           <h2 className="text-lg mb-1">Team Members</h2>
//           <p className="text-sm text-slate-600">{users.length} total users</p>
//         </div>
        
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b">
//                 <th className="text-left pb-3 pl-4 text-sm text-slate-600">User</th>
//                 <th className="text-left pb-3 text-sm text-slate-600">Email</th>
//                 <th className="text-left pb-3 text-sm text-slate-600">Role</th>
//                 <th className="text-left pb-3 text-sm text-slate-600">Status</th>
//                 <th className="text-left pb-3 text-sm text-slate-600">Last Active</th>
//                 <th className="text-right pb-3 pr-4 text-sm text-slate-600">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map((user) => (
//                 <tr 
//                   key={user.id} 
//                   className="border-b hover:bg-slate-50 transition-colors cursor-pointer"
//                   onClick={() => handleEditUser(user)}
//                 >
//                   <td className="py-4 pl-4">
//                     <div className="flex items-center gap-3">
//                       <Avatar className="w-10 h-10">
//                         <AvatarImage src={user.avatar} />
//                         <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
//                       </Avatar>
//                       <span>{user.name}</span>
//                     </div>
//                   </td>
//                   <td className="py-4">
//                     <div className="flex items-center gap-2 text-sm text-slate-600">
//                       <Mail className="w-4 h-4" />
//                       {user.email}
//                     </div>
//                   </td>
//                   <td className="py-4">
//                     <Badge className={getRoleColor(user.role)} variant="outline">
//                       {user.role}
//                     </Badge>
//                   </td>
//                   <td className="py-4">
//                     <Badge className={getStatusColor(user.status)} variant="outline">
//                       {user.status}
//                     </Badge>
//                   </td>
//                   <td className="py-4">
//                     <div className="flex items-center gap-2 text-sm text-slate-600">
//                       <Clock className="w-4 h-4" />
//                       {user.lastActive}
//                     </div>
//                   </td>
//                   <td className="py-4 pr-4">
//                     <div className="flex items-center justify-end">
//                       <Button 
//                         variant="ghost" 
//                         size="sm"
//                         onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
//                           e.stopPropagation();
//                           handleEditUser(user);
//                         }}
//                       >
//                         <MoreVertical className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Card>

//       {/* User Edit/Add Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
//             <DialogDescription>
//               {selectedUser ? 'Update user details and permissions' : 'Add a new team member to your organization'}
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Name</Label>
//               <Input 
//                 id="name" 
//                 placeholder="Enter full name"
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input 
//                 id="email" 
//                 type="email" 
//                 placeholder="user@company.com"
//                 value={formData.email}
//                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="role">Role</Label>
//               <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
//                 <SelectTrigger id="role">
//                   <SelectValue placeholder="Select role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Admin">Admin</SelectItem>
//                   <SelectItem value="Manager">Manager</SelectItem>
//                   <SelectItem value="Supervisor">Supervisor</SelectItem>
//                   <SelectItem value="Viewer">Viewer</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="branch">Branch</Label>
//               <Select value={formData.branch} onValueChange={(value: string) => setFormData({ ...formData, branch: value })}>
//                 <SelectTrigger id="branch">
//                   <SelectValue placeholder="Select branch" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="All Branches">All Branches</SelectItem>
//                   <SelectItem value="Downtown Branch">Downtown Branch</SelectItem>
//                   <SelectItem value="Westside Branch">Westside Branch</SelectItem>
//                   <SelectItem value="Eastside Branch">Eastside Branch</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="status">Status</Label>
//               <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value })}>
//                 <SelectTrigger id="status">
//                   <SelectValue placeholder="Select status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Active">Active</SelectItem>
//                   <SelectItem value="Inactive">Inactive</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
          
//           <DialogFooter>
//             {selectedUser && (
//               <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
//                 Delete User
//               </Button>
//             )}
//             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
//               {selectedUser ? 'Save Changes' : 'Add User'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

