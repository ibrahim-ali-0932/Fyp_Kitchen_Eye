import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { API_URL } from "../services/api";
import { getAuthToken } from "../services/authToken";

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) {
      return;
    }

    called.current = true;
    const plan = searchParams.get("plan")?.toLowerCase() || "pro";

    getAuthToken().then((token) => {
      if (!token) {
        return;
      }

      fetch(`${API_URL}/api/subscriptions/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      }).catch(console.error);
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl mb-3">Payment Successful!</h1>
        <p className="text-slate-600 mb-8">Your subscription is now active.</p>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}