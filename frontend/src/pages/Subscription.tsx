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
} from "lucide-react";
import { auth } from "../firebase";
import { createCheckoutSession } from "../services/subscriptionService";

export default function Subscription() {
  const navigate = useNavigate();

  const handleUpgrade = async (planName: string) => {
    const plan = planName.toLowerCase();

    if (plan === "basic") {
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
      await createCheckoutSession(plan, auth.currentUser.email);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Could not start checkout. Please try again.");
    }
  };

  const plans = [
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

  const features = [
    {
      icon: Camera,
      title: "Advanced AI Detection",
      description:
        "Industry-leading AI models for accurate violation detection",
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

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-4">
          <Crown className="w-4 h-4" />
          <span className="text-sm">Subscription Plans</span>
        </div>
        <h1 className="text-4xl mb-4">Choose Your Plan</h1>
        <p className="text-xl text-slate-600">
          Select the perfect plan for your hygiene monitoring needs
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, index) => {
          const colors = getPlanColorClasses(plan.color, plan.highlighted);
          return (
            <Card
              key={index}
              className={`p-8 ${colors.border} ${
                plan.highlighted ? "shadow-xl scale-105" : ""
              } relative`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className={colors.badge}>Most Popular</Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
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
                disabled={plan.name === "Basic"}
                onClick={() => handleUpgrade(plan.name)}
              >
                {plan.cta}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        feature.included ? "bg-green-100" : "bg-slate-100"
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl mb-4">All Plans Include</h2>
          <p className="text-lg text-slate-600">
            Essential features to ensure hygiene compliance
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <Card className="p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2">Can I change plans anytime?</h3>
            <p className="text-sm text-slate-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              take effect immediately.
            </p>
          </div>
          <div>
            <h3 className="mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-slate-600">
              We accept all major credit cards, PayPal, and bank transfers for
              Enterprise plans.
            </p>
          </div>
          <div>
            <h3 className="mb-2">Is there a free trial?</h3>
            <p className="text-sm text-slate-600">
              Yes, all paid plans come with a 14-day free trial. No credit card
              required.
            </p>
          </div>
          <div>
            <h3 className="mb-2">What happens to my data if I downgrade?</h3>
            <p className="text-sm text-slate-600">
              Your data is retained according to your new plan's retention
              policy. We recommend exporting reports before downgrading.
            </p>
          </div>
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-white border-blue-100 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl mb-4">Need a Custom Solution?</h2>
        <p className="text-slate-600 mb-6">
          Contact our sales team for custom pricing and features tailored to
          your organization's needs.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Contact Sales
          </Button>
          <Button size="lg" variant="outline">
            Schedule Demo
          </Button>
        </div>
      </Card>
    </div>
  );
}
