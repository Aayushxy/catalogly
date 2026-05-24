/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Store, MessageSquare, CreditCard, Sparkles, Check, Info } from "lucide-react";
import { Business } from "../types";
import { THEME_PRESETS } from "../data/seedData";

interface OnboardingFlowProps {
  onComplete: (business: Business) => void;
  onBack: () => void;
}

export default function OnboardingFlow({ onComplete, onBack }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Business info state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappNum, setWhatsappNum] = useState("");
  const [upiId, setUpiId] = useState("");
  const [address, setAddress] = useState("");
  const [themeId, setThemeId] = useState("classic-emerald");
  const [businessType, setBusinessType] = useState("boutique");

  const businessTypes = [
    { id: "boutique", label: "Clothing / Boutique", icon: "👗", desc: "Sarees, kurtas, jewelry" },
    { id: "kitchen", label: "Cloud Kitchen / Food", icon: "🍲", desc: "Biryani, tiffins, bakeries" },
    { id: "crafter", label: "Handmade / Gift Shop", icon: "🎁", desc: "Clay pottery, customized gifts" },
    { id: "grocery", label: "Kirana / Grocery", icon: "🥖", desc: "Daily essentials, spices" },
    { id: "cosmetics", label: "Cosmetics / Beauty", icon: "💄", desc: "Skincare, cosmetics, soaps" },
  ];

  const handleNameChange = (val: string) => {
    setName(val);
    // Generate clean slug auto-filled
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-"); // replace spaces with hyphens
    setSlug(autoSlug);
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setError("कृपया दुकान का नाम लिखें! (Please enter your Shop Name)");
      return false;
    }
    if (!slug.trim()) {
      setError("कृपया दुकान का लिंक तय करें! (Please set the store web address)");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!whatsappNum.trim()) {
      setError("कृपया WhatsApp नंबर दर्ज करें! (Please enter your WhatsApp Number)");
      return false;
    }
    // Simple Indian phone validate 10 digits
    const cleanPhone = whatsappNum.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("कृपया एक सही 10-अंकों का नंबर लिखें! (Please enter a valid 10-digit number)");
      return false;
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    // Format phone number to clean Indian format e.g. 91xxxxxxxxxx
    let formattedPhone = whatsappNum.replace(/\D/g, "");
    if (formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith("0")) {
      formattedPhone = "91" + formattedPhone.substring(1);
    }

    const newBusiness: Omit<Business, "views" | "ordersCount" | "createdAt"> = {
      id: "biz-" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || `Welcome to ${name.trim()}! We provide the best premium items handcrafted with love.`,
      logo: businessTypes.find((t) => t.id === businessType)?.icon || "🛍️",
      whatsappNum: formattedPhone,
      upiId: upiId.trim() || "",
      address: address.trim() || "India",
      instagram: "",
      themeId: themeId,
      plan: "FREE",
      categories: ["Best Sellers", "New Arrivals"],
    };

    try {
      const response = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBusiness),
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed to create storefront link.");
      }

      const savedBusiness = await response.json();
      onComplete(savedBusiness);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try a different shop slug.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition duration-150"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Catalogly <span className="text-emerald-500">🇮🇳</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          दुकान ऑनलाइन लाएं मात्र 1 मिनट में | Setup your digital store in 1 minute
        </p>

        {/* Steps Progress Breadcrumb */}
        <div className="mt-6 flex justify-center items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 ${
                  step === s
                    ? "bg-slate-900 text-white ring-4 ring-slate-100"
                    : step > s
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 text-xs text-rose-700 font-medium rounded">
              {error}
            </div>
          )}

          {/* STEP 1: Basic Shop Details */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm border-b pb-2 mb-2">
                <Store className="w-5 h-5" />
                <span>चरण 1: दुकान की जानकारी (Step 1: Shop Info)</span>
              </div>

              {/* Shop Type Options Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  दुकान का प्रकार / Choose Shop Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {businessTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBusinessType(t.id)}
                      className={`p-3 text-left border rounded-xl flex items-center gap-3 transition duration-150 ${
                        businessType === t.id
                          ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{t.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  दुकान का नाम / Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. Kiran Sari Kendra, Rajesh Sweets"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-slate-800 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition font-medium placeholder-slate-400"
                />
              </div>

              {/* Automatic Shop URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  आपका कस्टमाइज्ड लिंक / Your Store Address link
                </label>
                <div className="flex rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-slate-50">
                  <span className="inline-flex items-center px-3 text-slate-500 text-xs font-mono select-none">
                    catalogly.app/store/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="flex-1 min-w-0 text-slate-800 px-3 py-3 border-l bg-white border-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs font-bold"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  Your customers will visit this address link directly over mobile/web!
                </p>
              </div>

              {/* Short Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  विवरण / Shop Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="उदा. जयपुर की शानदार साड़ियां और बेहतरीन सूट। We deliver premium kurtas & block fabrics."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-slate-800 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition text-sm placeholder-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full mt-2 bg-slate-900 text-white rounded-xl py-3.5 hover:bg-slate-800 font-bold text-sm tracking-wide transition duration-150 flex items-center justify-center gap-2 shadow"
              >
                आगे बढ़ें / Next <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Mobile/WhatsApp and UPI payment setup */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm border-b pb-2 mb-2">
                <MessageSquare className="w-5 h-5" />
                <span>चरण 2: व्हाट्सएप और पेमेंट (Step 2: Contact & UPI)</span>
              </div>

              {/* WhatsApp mobile phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  व्हाट्सएप नंबर / Active WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
                  <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-slate-200 text-slate-700 font-bold text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765-XXXXX (10 अंकों का नंबर लिखें)"
                    value={whatsappNum}
                    onChange={(e) => setWhatsappNum(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 text-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold placeholder-slate-400"
                  />
                </div>
                <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                  We generate direct-orders over WhatsApp to this exact number!
                </p>
              </div>

              {/* UPI VPA for direct QR payments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  यूपीआई आईडी / Your UPI ID (Optional)
                </label>
                <div className="relative rounded-xl border border-slate-200 overflow-hidden flex">
                  <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-slate-200">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="उदा. name@okaxis, shopname@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.trim())}
                    className="flex-1 text-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono font-bold uppercase tracking-wide text-xs placeholder-slate-400"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  Required to generate dynamic checkout QR codes automatically!
                </p>
              </div>

              {/* Store Pickup / Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  दुकान का पता / Store Pickup Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="उदा. Sector 5, Gandhi Nagar, Delhi"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-slate-800 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition text-sm placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-full border border-slate-200 text-slate-700 rounded-xl py-3 hover:bg-slate-50 font-bold text-xs"
                >
                  पीछे जाएं / Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-slate-900 text-white rounded-xl py-3 hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1"
                >
                  आगे बढ़ें / Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Storefront Theme Vibe Selection */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm border-b pb-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span>चरण 3: लुक और डिज़ाइन (Step 3: Theme Branding)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  दुकान का थीम कलर / Choose Brand Theme Vibe
                </label>
                <div className="space-y-2">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeId(t.id)}
                      className={`w-full p-3.5 border rounded-xl flex items-center justify-between transition duration-150 ${
                        themeId === t.id
                          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${t.preview} shadow-sm border border-black/10`} />
                        <span className="text-xs font-bold text-slate-800">{t.name}</span>
                      </div>
                      {themeId === t.id && (
                        <span className="p-1 bg-slate-900 rounded-full text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <p className="p-3 bg-indigo-50/50 rounded-xl text-[10px] text-slate-500 font-semibold border border-indigo-100 flex items-center gap-2 leading-relaxed">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                No login required! Your catalog starts with realistic stock samples that you can edit instantly.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-full border border-slate-200 text-slate-700 rounded-xl py-3.5 hover:bg-slate-50 font-bold text-xs"
                >
                  पीछे जाएं / Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white rounded-xl py-3.5 hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  {loading ? (
                    "तैयार किया जा रहा है..."
                  ) : (
                    <>
                      दुकान चालू करें! / Build Store <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
