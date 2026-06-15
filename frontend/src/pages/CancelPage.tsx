import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function CancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-500" />
        </div>
        <h1 className="text-2xl mb-3">Payment Cancelled</h1>
        <p className="text-slate-600 mb-8">No charges were made.</p>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          onClick={() => navigate("/dashboard/subscription")}
        >
          Back to Plans
        </Button>
      </Card>
    </div>
  );
}