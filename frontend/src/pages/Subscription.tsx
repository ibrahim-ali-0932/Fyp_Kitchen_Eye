import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Check,
  Zap,
  Crown,
  Building2,
  Camera,
  Users,
  FileText,
  BarChart3,
  Loader2,
  ShieldCheck,
  BellRing,
} from "lucide-react";
import { auth } from "../firebase";
import {
  cancelSubscription,
  createCheckoutSession,
  fetchCurrentSubscription,
  type SubscriptionDetails,
} from "../services/subscriptionService";

const PAID_STATUSES = new Set(["active", "trialing", "past_due", "cancel_at_period_end"]);

type PlanCard = {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: typeof Camera;
  color: string;
  features: { text: string; included: boolean }[];
  cta: string;
  highlighted: boolean;
};

export default function Subscription() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [busyCancel, setBusyCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans: PlanCard[] = [
    {
      name: "Basic",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out KitchenEye",
      icon: Camera,
      color: "slate",
      features: [
        { text: "1 camera feed", included: true },
        { text: "Basic violation detection", included: true },
        { text: "Email notifications", included: true },
        { text: "7 days data retention", included: true },
        { text: "Monthly reports", included: true },
        { text: "SMS alerts", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Multi-branch support", included: false },
        { text: "API access", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Current Plan",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$99",
      period: "per month",
      description: "For growing restaurants and chains",
      icon: Zap,
      color: "blue",
      features: [
        { text: "Up to 10 camera feeds", included: true },
        { text: "Advanced AI detection", included: true },
        { text: "Email & SMS notifications", included: true },
        { text: "90 days data retention", included: true },
        { text: "Weekly & monthly reports", included: true },
        { text: "Advanced analytics dashboard", included: true },
        { text: "Multi-branch support (up to 3)", included: true },
        { text: "Custom alerts", included: true },
        { text: "API access", included: false },
        { text: "Priority support", included: true },
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large organizations with multiple locations",
      icon: Building2,
      color: "purple",
      features: [
        { text: "Unlimited camera feeds", included: true },
        { text: "Enterprise AI detection", included: true },
        { text: "All notification channels", included: true },
        { text: "Unlimited data retention", included: true },
        { text: "Custom reports & scheduling", included: true },
        { text: "Advanced analytics & insights", included: true },
        { text: "Unlimited branches", included: true },
        { text: "Custom integrations", included: true },
        { text: "Full API access", included: true },
        { text: "Dedicated support manager", included: true },
        { text: "On-premise deployment option", included: true },
        { text: "Custom AI model training", included: true },
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const currentPlan = (subscription?.plan || "basic").toLowerCase();
  const currentStatus = (subscription?.status || subscription?.subscription_status || "basic").toLowerCase();
  const isPaidSubscription = currentPlan !== "basic" && PAID_STATUSES.has(currentStatus);
  const currentPlanCard = plans.find((plan) => plan.name.toLowerCase() === currentPlan) || plans[0];

  const features = [
    {
      icon: Camera,
      title: "Advanced AI Detection",
      description: "Industry-leading AI models for accurate violation detection",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members and manage permissions",
    },
    {
      icon: FileText,
      title: "Compliance Reports",
      description: "Automated reports for audits and regulatory compliance",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Insights and trends to improve hygiene standards",
    },
  ];

  const currentPlanFeatures = useMemo(() => {
    return currentPlanCard.features.filter((feature) => feature.included).map((feature) => feature.text);
  }, [currentPlanCard]);

  const formatDate = (value?: string | null) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchCurrentSubscription();
        if (!active) return;
        setSubscription(data);
      } catch (err: any) {
        if (!active) return;
        console.error("Subscription load failed:", err);
        setError(err?.message || "Failed to load subscription details");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleUpgrade = async (planName: string) => {
    const plan = planName.toLowerCase();

    if (plan === "basic") {
      return;
    }

    if (plan === currentPlan && PAID_STATUSES.has(currentStatus)) {
      setMessage("You are already subscribed to this plan.");
      return;
    }

    if (plan === "enterprise") {
      window.location.href = "mailto:sales@kitcheneye.com";
      return;
    }

    if (!auth.currentUser?.email) {
      navigate("/login");
      return;
    }

    try {
      setBusyPlan(plan);
      setError(null);
      setMessage(null);
      await createCheckoutSession(plan, auth.currentUser.email);
    } catch (checkoutError: any) {
      console.error("Checkout error:", checkoutError);
      setError(checkoutError?.message || "Could not start checkout. Please try again.");
    } finally {
      setBusyPlan(null);
    }
  };

  const handleCancel = async () => {
    const confirmed = window.confirm("Cancel your subscription at the end of the current billing period?");
    if (!confirmed) return;

    try {
      setBusyCancel(true);
      setError(null);
      setMessage(null);
      const result = await cancelSubscription();
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              status: result.status,
              subscription_status: "cancel_at_period_end",
              cancel_at_period_end: true,
              current_period_start: result.current_period_start ?? prev.current_period_start,
              current_period_end: result.current_period_end ?? prev.current_period_end,
              next_billing_date: result.next_billing_date ?? prev.next_billing_date,
            }
          : prev
      );
      setMessage("Subscription will cancel at the end of the current billing period.");
    } catch (cancelError: any) {
      console.error("Cancel error:", cancelError);
      setError(cancelError?.message || "Could not cancel subscription.");
    } finally {
      setBusyCancel(false);
    }
  };

  const getPlanColorClasses = (color: string, highlighted: boolean) => {
    if (highlighted) {
      return {
        border: "border-blue-200 ring-2 ring-blue-500",
        badge: "bg-blue-600 text-white",
        icon: "bg-gradient-to-br from-blue-500 to-blue-600",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
      };
    }

    switch (color) {
      case "slate":
        return {
          border: "border-slate-200",
          badge: "bg-slate-100 text-slate-700",
          icon: "bg-gradient-to-br from-slate-400 to-slate-500",
          button: "bg-slate-200 text-slate-700 hover:bg-slate-300",
        };
      case "purple":
        return {
          border: "border-purple-200",
          badge: "bg-purple-100 text-purple-700",
          icon: "bg-gradient-to-br from-purple-500 to-purple-600",
          button: "bg-purple-600 hover:bg-purple-700 text-white",
        };
      default:
        return {
          border: "border-slate-200",
          badge: "bg-slate-100 text-slate-700",
          icon: "bg-gradient-to-br from-slate-400 to-slate-500",
          button: "bg-slate-600 hover:bg-slate-700 text-white",
        };
    }
  };

  const planFeaturesSection = isPaidSubscription ? (
    <Card className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl mb-2">Your Plan Benefits</h2>
          <p className="text-slate-600">Everything included in your current subscription.</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">
          Active Plan
        </Badge>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentPlanFeatures.map((feature) => (
          <div key={feature} className="flex items-center gap-3 rounded-lg border p-3 bg-slate-50">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-slate-700">{feature}</span>
          </div>
        ))}
      </div>
    </Card>
  ) : null;

  return (
    <div className="p-6 space-y-8">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-4">
          <Crown className="w-4 h-4" />
          <span className="text-sm">Subscription</span>
        </div>
        <h1 className="text-4xl mb-4">{isPaidSubscription ? "Manage Your Plan" : "Choose Your Plan"}</h1>
        <p className="text-xl text-slate-600">
          {isPaidSubscription
            ? "Review billing details, next renewal date, and manage your active subscription."
            : "Select the perfect plan for your hygiene monitoring needs."}
        </p>
      </div>

      {loading ? (
        <Card className="max-w-4xl mx-auto p-8 text-center text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          Loading subscription details...
        </Card>
      ) : null}

      {error && (
        <Card className="max-w-4xl mx-auto p-4 border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      )}

      {message && (
        <Card className="max-w-4xl mx-auto p-4 border-emerald-200 bg-emerald-50 text-emerald-700">
          {message}
        </Card>
      )}

      {isPaidSubscription ? (
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="p-8 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 border">
                  <BellRing className="w-4 h-4 text-blue-600" />
                  {currentPlanCard.name} Plan
                </div>
                <div>
                  <h2 className="text-3xl mb-2">Current Subscription</h2>
                  <p className="text-slate-600 max-w-2xl">
                    Your account is active. Review renewal timing, billing status, and the features included in your plan.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border bg-white px-7 py-7 sm:px-8 sm:py-8 w-full sm:min-w-[520px] shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className={currentStatus === "cancel_at_period_end" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"} variant="outline">
                    {currentStatus || "active"}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4"><span>Current plan</span><span className="text-slate-900">{currentPlanCard.name}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>Next billing date</span><span className="text-slate-900">{formatDate(subscription?.next_billing_date ?? subscription?.current_period_end)}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>Current period end</span><span className="text-slate-900">{formatDate(subscription?.current_period_end)}</span></div>
                  <div className="flex items-center justify-between gap-4"><span>Current period start</span><span className="text-slate-900">{formatDate(subscription?.current_period_start)}</span></div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleUpgrade("Enterprise")}
                    disabled={currentPlanCard.name === "Enterprise"}
                  >
                    {currentPlanCard.name === "Enterprise" ? "Current Plan" : "Upgrade to Enterprise"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={busyCancel || currentStatus === "cancel_at_period_end"}
                  >
                    {busyCancel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {currentStatus === "cancel_at_period_end" ? "Cancelling" : "Cancel Subscription"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {planFeaturesSection}
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const colors = getPlanColorClasses(plan.color, plan.highlighted);
              const isCurrentPaidPlan = plan.name.toLowerCase() === currentPlan;
              const isDisabled = isCurrentPaidPlan && PAID_STATUSES.has(currentStatus) || plan.name === "Basic";

              return (
                <Card
                  key={index}
                  className={`p-8 ${colors.border} ${plan.highlighted ? "shadow-xl scale-105" : ""} relative`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className={colors.badge}>Most Popular</Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl mb-2">{plan.name}</h2>
                    <div className="mb-2">
                      <span className="text-4xl">{plan.price}</span>
                      {plan.price !== "Custom" && plan.price !== "$0" && (
                        <span className="text-slate-600 ml-2">/ month</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{plan.description}</p>
                  </div>

                  <Button
                    className={`w-full mb-6 ${colors.button}`}
                    size="lg"
                    disabled={isDisabled || busyPlan === plan.name.toLowerCase()}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    {busyPlan === plan.name.toLowerCase() ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isCurrentPaidPlan && PAID_STATUSES.has(currentStatus) ? "Current Plan" : plan.cta}
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${feature.included ? "bg-green-100" : "bg-slate-100"}`}>
                          {feature.included ? <Check className="w-3 h-3 text-green-600" /> : <span className="text-slate-400 text-xs">—</span>}
                        </div>
                        <span className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400"}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl mb-4">All Plans Include</h2>
              <p className="text-lg text-slate-600">Essential features to ensure hygiene compliance</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
