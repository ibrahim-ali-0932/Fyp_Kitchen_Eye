import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { fetchBranches, createBranch, deleteBranch, type Branch } from "../services/branchService";
import { authorizedFetch } from "../services/authToken";
import { API_URL } from "../services/api";

type CameraRecord = {
  id: string;
  branch_id?: string;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cameraRecords, setCameraRecords] = useState<CameraRecord[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [branchList, cameraRes] = await Promise.all([
        fetchBranches(),
        authorizedFetch(`${API_URL}/auth/cameras/`),
      ]);

      const cameraData = cameraRes.ok ? await cameraRes.json() : { cameras: [] };
      setBranches(branchList);
      setCameraRecords((cameraData.cameras ?? []) as CameraRecord[]);
    } catch (e: any) {
      setError(e.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cameraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const camera of cameraRecords) {
      const key = String(camera.branch_id || "");
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [cameraRecords]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setBusy(true);
    setError(null);
    try {
      await createBranch(name.trim(), address.trim());
      setName("");
      setAddress("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to create branch");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (branchId: string, branchName: string) => {
    const confirmed = window.confirm(`Delete branch \"${branchName}\"?`);
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      await deleteBranch(branchId);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to delete branch");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Branches</h1>
        <p className="text-slate-600">Create and manage branch locations and assignments.</p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl">Add Branch</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name</Label>
            <Input
              id="branch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Kitchen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-address">Address</Label>
            <Input
              id="branch-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Market Street"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={busy || !name.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl mb-4">Existing Branches</h2>
        {loading ? (
          <p className="text-slate-500">Loading branches...</p>
        ) : branches.length === 0 ? (
          <p className="text-slate-500">No branches created yet.</p>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={branch.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-base">{branch.name}</p>
                  <p className="text-sm text-slate-600">{branch.address || "No address"}</p>
                  <p className="text-xs text-slate-500 mt-1">Cameras: {cameraCounts[branch.id] || 0}</p>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDelete(branch.id, branch.name)}
                  disabled={busy}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </Card>
    </div>
  );
}
