import { useState } from "react";
import { Search, Plus, ChevronRight } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components//ui/button";
import { Badge } from "../components//ui/badge";
import { Avatar, AvatarFallback } from "../components//ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components//ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components//ui/select";
import type { User } from "./AdminPanel";

interface UsersListProps {
  users: User[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  onAddUser: (user: Omit<User, "id" | "lastActive" | "avatar">) => void;
}

export function UsersList({ users, selectedUserId, onSelectUser, onAddUser }: UsersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Viewer" as User["role"],
    status: "Active" as User["status"],
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      onAddUser(newUser);
      setNewUser({
        name: "",
        email: "",
        role: "Viewer",
        status: "Active",
      });
      setIsAddUserOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#90a1b9]" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
          />
        </div>
      </div>

      {/* Add User Button */}
      <div className="p-4">
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90">
              <Plus className="size-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription className="text-[#90a1b9]">
                Create a new user account for the KitchenEye system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#90a1b9] mb-1.5 block">Name</label>
                <Input
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
                />
              </div>
              <div>
                <label className="text-sm text-[#90a1b9] mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
                />
              </div>
              <div>
                <label className="text-sm text-[#90a1b9] mb-1.5 block">Role</label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: string) => setNewUser({ ...newUser, role: value as User["role"] })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f3a] border-white/10 text-white">
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#90a1b9] mb-1.5 block">Status</label>
                <Select
                  value={newUser.status}
                  onValueChange={(value: string) => setNewUser({ ...newUser, status: value as User["status"] })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f3a] border-white/10 text-white">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filteredUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={`w-full p-4 rounded-lg border transition-all text-left ${
              selectedUserId === user.id
                ? "bg-white/10 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#155dfc] to-[#9810fa] text-white">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-white truncate">{user.name}</h4>
                  <ChevronRight className="size-4 text-[#90a1b9] shrink-0" />
                </div>
                <p className="text-sm text-[#90a1b9] truncate mb-2">{user.email}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={user.role === "Admin" ? "default" : "secondary"}
                    className={
                      user.role === "Admin"
                        ? "bg-gradient-to-r from-[#155dfc] to-[#9810fa] border-0"
                        : "bg-white/10 border-white/20 text-white"
                    }
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant={user.status === "Active" ? "default" : "secondary"}
                    className={
                      user.status === "Active"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-gray-500/20 border-gray-500/50 text-gray-400"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#90a1b9] mt-2">
                  Last active: {user.lastActive}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
