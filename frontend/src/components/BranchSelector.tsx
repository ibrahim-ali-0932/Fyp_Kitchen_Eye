import { useEffect, useState } from "react";
import { authorizedFetch } from "../services/authToken";
import { API_URL } from "../services/api";

export type BranchOption = { id: string; name: string };

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BranchSelector({ value, onChange }: Props) {
  const [branches, setBranches] = useState<BranchOption[]>([]);

  useEffect(() => {
    authorizedFetch(`${API_URL}/branches/`)
      .then((r) => r.json())
      .then((data) => setBranches(data.branches ?? []))
      .catch(console.error);
  }, []);

  const options = [{ id: "all", name: "All Branches" }, ...branches];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((b) => (
        <button
          key={b.id}
          onClick={() => onChange(b.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            value === b.id
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
          }`}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}
