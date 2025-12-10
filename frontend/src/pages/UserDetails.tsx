import { useState } from "react";
import { Edit2, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components//ui/button";
import { Badge } from "../components//ui/badge";
import { Avatar, AvatarFallback } from "../components//ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components//ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components//ui/dialog";
import type { User } from "./AdminPanel";

interface UserDetailsProps {
  user: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
}

export function UserDetails({ user, onUpdateUser, onDeleteUser }: UserDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedRole, setEditedRole] = useState(user.role);
  const [editedStatus, setEditedStatus] = useState(user.status);

  const handleSave = () => {
    onUpdateUser(user.id, {
      role: editedRole,
      status: editedStatus,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRole(user.role);
    setEditedStatus(user.status);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteUser(user.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-white">User Details</CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
                  >
                    <Save className="size-4" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit2 className="size-4" />
                    Edit User
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete User
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="size-20 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-[#155dfc] to-[#9810fa] text-white text-2xl">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-white mb-1">{user.name}</h3>
                <p className="text-[#90a1b9]">{user.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#90a1b9] mb-1.5 block">Role</label>
                  {isEditing ? (
                    
                    <Select value={editedRole} onValueChange={(value: string) => setEditedRole(value as User["role"])}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-white/10 text-white">
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                </div>
                
                <div>
                  <label className="text-sm text-[#90a1b9] mb-1.5 block">Status</label>
                  {isEditing ? (
                    <Select value={editedStatus} onValueChange={(value: string) => setEditedStatus(value as User["status"])}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-white/10 text-white">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-[#90a1b9]">
                  Last active: <span className="text-white">{user.lastActive}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Are you sure you want to delete {user.name}? This action cannot be undone and will also remove all associated cameras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
