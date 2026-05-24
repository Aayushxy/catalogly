/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import OnboardingFlow from "./components/OnboardingFlow";
import Dashboard from "./components/Dashboard";
import Storefront from "./components/Storefront";
import { Business, Product } from "./types";

type ViewState = 
  | { type: "landing" }
  | { type: "onboarding" }
  | { type: "dashboard"; business: Business }
  | { type: "storefront"; slug: string; returnTo?: "landing" | "dashboard" };

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>({ type: "landing" });
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [activeBusinessDetails, setActiveBusinessDetails] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);

  // Load products whenever we view a storefront slug
  useEffect(() => {
    if (currentView.type === "storefront") {
      setLoading(true);
      fetch(`/api/business/by-slug/${currentView.slug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Storefront slug not resolved via server db.");
          return res.json();
        })
        .then((data: { business: Business; products: Product[] }) => {
          setActiveBusinessDetails(data.business);
          setActiveProducts(data.products);
          
          // Increment visitor metrics on the background
          fetch(`/api/business/${data.business.id}/view`, { method: "POST" }).catch(console.error);
        })
        .catch((err) => {
          console.error("Storefront loader error:", err);
          alert("The requested storefront address was not found.");
          setCurrentView({ type: "landing" });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [currentView]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      
      {/* LOADING SPINNERS */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-center items-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3">
            <span className="text-3xl animate-bounce select-none">🛍️</span>
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin" />
            <p className="text-xs font-bold text-slate-700">Connecting to Catalogly...</p>
          </div>
        </div>
      )}

      {/* CORE VIEW RENDERING */}
      {currentView.type === "landing" && (
        <LandingPage
          onCreateStore={() => setCurrentView({ type: "onboarding" })}
          onSelectBusinessDemo={(biz) => 
            setCurrentView({ type: "storefront", slug: biz.slug, returnTo: "landing" })
          }
        />
      )}

      {currentView.type === "onboarding" && (
        <OnboardingFlow
          onComplete={(newBiz) => setCurrentView({ type: "dashboard", business: newBiz })}
          onBack={() => setCurrentView({ type: "landing" })}
        />
      )}

      {currentView.type === "dashboard" && (
        <Dashboard
          initialBusiness={currentView.business}
          onViewStore={(slug) => 
            setCurrentView({ type: "storefront", slug, returnTo: "dashboard" })
          }
          onBackToLanding={() => setCurrentView({ type: "landing" })}
        />
      )}

      {currentView.type === "storefront" && activeBusinessDetails && (
        <Storefront
          business={activeBusinessDetails}
          products={activeProducts}
          isDemoMode={currentView.returnTo === "landing"}
          onBackToAdmin={
            currentView.returnTo === "dashboard"
              ? () => setCurrentView({ type: "dashboard", business: activeBusinessDetails })
              : () => setCurrentView({ type: "landing" })
          }
        />
      )}
    </div>
  );
}
