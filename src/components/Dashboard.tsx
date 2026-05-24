/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, Store, ShoppingBag, Landmark, Settings, 
  Trash2, Plus, Edit, Share2, Sparkles, Check, 
  ChevronUp, ChevronDown, ListFilter, CreditCard, 
  ExternalLink, Printer, Clipboard, Clock, MessageSquare, Loader2, X
} from "lucide-react";
import { Business, Product, Order, ThemePreset } from "../types";
import { THEME_PRESETS } from "../data/seedData";

interface DashboardProps {
  initialBusiness: Business;
  onViewStore: (slug: string) => void;
  onBackToLanding: () => void;
}

export default function Dashboard({ initialBusiness, onViewStore, onBackToLanding }: DashboardProps) {
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"insights" | "products" | "orders" | "design" | "pdf">("insights");
  
  // Create / Edit Product State
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form Fields for Product
  const [pName, setPName] = useState("");
  const [pDescription, setPDescription] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDiscountPrice, setPDiscountPrice] = useState("");
  const [pCategory, setPCategory] = useState("Best Sellers");
  const [pStock, setPStock] = useState<"IN_STOCK" | "OUT_OF_STOCK">("IN_STOCK");
  const [pImageBase64, setPImageBase64] = useState("");
  
  // Custom Product Variant list builder
  const [variantsList, setVariantsList] = useState<{ name: string; options: string[] }[]>([]);
  const [newVarName, setNewVarName] = useState("");
  const [newVarOptions, setNewVarOptions] = useState("");

  // Gemini AI descriptions states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [aiTone, setAiTone] = useState("Warm, luxurious and friendly");

  // Profile Form field states
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileWhatsapp, setProfileWhatsapp] = useState("");
  const [profileUpi, setProfileUpi] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileInstagram, setProfileInstagram] = useState("");
  const [profileSlug, setProfileSlug] = useState("");
  const [profileThemeId, setProfileThemeId] = useState("");
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // PDF Configuration settings
  const [pdfShowDiscount, setPdfShowDiscount] = useState(true);
  const [pdfShowQR, setPdfShowQR] = useState(true);
  const [pdfFilterCategory, setPdfFilterCategory] = useState("All");

  // Load shop data
  const loadDashboardData = async () => {
    try {
      // Products fetch
      const pRes = await fetch(`/api/business/${business.id}/products`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
      }
      // Orders fetch
      const oRes = await fetch(`/api/business/${business.id}/orders`);
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
      }
      // Refresh business views/orders stats
      const bRes = await fetch(`/api/business/${business.id}`);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBusiness(bData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Pre-fill profile fields
    setProfileName(business.name);
    setProfileDescription(business.description);
    setProfileWhatsapp(business.whatsappNum.replace(/^91/, ""));
    setProfileUpi(business.upiId || "");
    setProfileAddress(business.address || "");
    setProfileInstagram(business.instagram || "");
    setProfileSlug(business.slug);
    setProfileThemeId(business.themeId);
  }, [business.id]);

  // Handle Copy store Link
  const copyStoreLinkUrl = () => {
    const fullUrl = `${window.location.origin}/store/${business.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Convert image file upload to base64 string
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Gemini Copywriter API
  const handleGenerateAiDescription = async () => {
    if (!pName.trim()) {
      alert("Please specify a Product Name first to help Gemini understand the model context!");
      return;
    }
    setAiGenerating(true);
    try {
      const payload = {
        productName: pName.trim(),
        category: pCategory,
        notes: aiNotes.trim(),
        tone: aiTone,
      };

      const response = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setPDescription(data.description);
        // Automatically add recommended tags into notes helper if needed
        if (data.tagline) {
          setPDescription((prev) => `${prev}\n\n*✨ Vibe Tagline: "${data.tagline}"*`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch generated descriptions:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Add category option
  const addProductVariant = () => {
    if (!newVarName.trim() || !newVarOptions.trim()) return;
    const opts = newVarOptions.split(",").map((o) => o.trim()).filter(Boolean);
    const updated = [...variantsList, { name: newVarName.trim(), options: opts }];
    setVariantsList(updated);
    setNewVarName("");
    setNewVarOptions("");
  };

  const removeVariantIndex = (idx: number) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Product Actions (Add / Edit / Delete)
  const openAddProductModal = () => {
    setIsEditingProduct(null);
    setPName("");
    setPDescription("");
    setPPrice("");
    setPCategory("Best Sellers");
    setPDiscountPrice("");
    setPStock("IN_STOCK");
    setPImageBase64("");
    setVariantsList([]);
    setIsAddingProduct(true);
  };

  const openEditProductModal = (prod: Product) => {
    setIsEditingProduct(prod);
    setPName(prod.name);
    setPDescription(prod.description || "");
    setPPrice(prod.price.toString());
    setPDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : "");
    setPCategory(prod.category || "Best Sellers");
    setPStock(prod.stockStatus);
    setPImageBase64(prod.image || "");
    setVariantsList(prod.variants || []);
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pPrice.trim()) return;

    const payload: Product = {
      id: isEditingProduct ? isEditingProduct.id : "prod-" + Math.random().toString(36).substring(2, 9),
      businessId: business.id,
      name: pName.trim(),
      description: pDescription.trim(),
      price: parseFloat(pPrice),
      discountPrice: pDiscountPrice.trim() ? parseFloat(pDiscountPrice) : null,
      category: pCategory.trim() || "Best Sellers",
      stockStatus: pStock,
      image: pImageBase64 || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80",
      images: [],
      variants: variantsList,
      sortOrder: isEditingProduct ? isEditingProduct.sortOrder : products.length,
    };

    try {
      const isEdit = !!isEditingProduct;
      const url = isEdit ? `/api/products/${payload.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddingProduct(false);
        setIsEditingProduct(null);
        await loadDashboardData();
      }
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action is irreversible.")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const reorderProduct = async (idx: number, op: "up" | "down") => {
    const nextIdx = op === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= products.length) return;

    const updated = [...products];
    const temporary = updated[idx];
    updated[idx] = updated[nextIdx];
    updated[nextIdx] = temporary;

    setProducts(updated);

    try {
      await fetch("/api/products/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          orderedIds: updated.map((p) => p.id),
        }),
      });
    } catch (err) {
      console.error("Reorder failed on server:", err);
    }
  };

  // Manage profile settings save
  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileSlug.trim()) {
      alert("Business Name and link address slug are required.");
      return;
    }

    setSavedSuccessMessage(null);

    // Format phone
    let cleanPh = profileWhatsapp.replace(/\D/g, "");
    if (cleanPh.length === 10) {
      cleanPh = "91" + cleanPh;
    }

    const payload: Business = {
      ...business,
      name: profileName.trim(),
      slug: profileSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      description: profileDescription.trim(),
      whatsappNum: cleanPh,
      upiId: profileUpi.trim(),
      address: profileAddress.trim(),
      instagram: profileInstagram.trim(),
      themeId: profileThemeId,
    };

    try {
      const response = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const saved = await response.json();
        setBusiness(saved);
        setSavedSuccessMessage("बधाई हो! आपकी दुकान की सेटिंग्स सफतापूर्वक सहेज ली गई हैं! Changes saved successfully.");
        setTimeout(() => setSavedSuccessMessage(null), 4000);
      } else {
        const errObj = await response.json();
        alert(errObj.error || "Failed to save profile. Check link slug duplicates.");
      }
    } catch (err: any) {
      alert("Error saving branding settings.");
    }
  };

  // Update customer order status
  const updateOrder = async (orderId: string, newStats: "NEW" | "COMPLETED" | "CANCELLED", payStats: "PENDING" | "PAID") => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStats, paymentStatus: payStats }),
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Quick printable wrapper handler for clean A4 printing!
  const triggerWindowPrintAction = () => {
    window.print();
  };

  // Distinct Categories list including All
  const availableCategoriesList = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return ["All", ...Array.from(list)];
  }, [products]);

  // Clean filters for pdf print catalog
  const printableProductsFiltered = useMemo(() => {
    return products.filter((p) => {
      return pdfFilterCategory === "All" || p.category === pdfFilterCategory;
    });
  }, [products, pdfFilterCategory]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between print:hidden">
        <div>
          {/* Logo Branding */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{business.logo || "🛍️"}</span>
              <div>
                <h3 className="text-sm font-black tracking-wider leading-none">CATALOGLY</h3>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mt-1">
                  Merchant Deck
                </span>
              </div>
            </div>
            {/* Free plan badge */}
            <span className={`text-[9px] font-black px-2 mt-0.5 py-0.5 rounded ${
              business.plan === "PREMIUM" ? "bg-yellow-500 text-slate-950" : "bg-white/10 text-white/60"
            }`}>
              {business.plan}
            </span>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("insights")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                activeTab === "insights" ? "bg-emerald-600 text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" /> Insights & Analytics
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                activeTab === "products" ? "bg-emerald-600 text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" /> Product Manager
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition cursor-pointer relative ${
                activeTab === "orders" ? "bg-emerald-600 text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" /> Customer Orders
              {orders.filter((o) => o.status === "NEW").length > 0 && (
                <span className="absolute top-3 right-4 bg-rose-500 text-white rounded-full w-4 h-4 text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {orders.filter((o) => o.status === "NEW").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("design")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                activeTab === "design" ? "bg-emerald-600 text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" /> Store settings
            </button>

            <button
              onClick={() => setActiveTab("pdf")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                activeTab === "pdf" ? "bg-emerald-600 text-white shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Printer className="w-4 h-4 shrink-0" /> PDF Catalog Studio
            </button>
          </nav>
        </div>

        {/* User Account / Footer controls */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span className="text-xl shrink-0">📈</span>
            <div className="min-w-0">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide leading-none">Store Link</p>
              <p className="text-xs font-bold text-emerald-400 truncate mt-1">/store/{business.slug}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            <button
              onClick={() => onViewStore(business.slug)}
              className="bg-emerald-600 py-2.5 px-3 rounded-lg text-white hover:bg-emerald-500 transition cursor-pointer text-center"
            >
              View Shop
            </button>
            <button
              onClick={onBackToLanding}
              className="bg-white/10 py-2.5 px-3 rounded-lg text-white/80 hover:bg-white/15 transition cursor-pointer text-center"
            >
              Exit Panel
            </button>
          </div>
        </div>
      </aside>

      {/* DASHBOARD CENTRAL SCREEN SPACE */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-5xl print:p-0 print:bg-white">
        
        {/* TOP LIVE QUICK-ACTION SUMMARY LINK HEADER */}
        <header className="mb-6 pb-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest block">
              Indian Retail Platform
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              नमस्कार! Welcome, {business.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Track visitors count, customize inventories, and secure UPI-WhatsApp transactions on the spot.
            </p>
          </div>

          {/* Quick share controls */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={copyStoreLinkUrl}
              className={`px-4 py-2 text-xs font-bold border rounded-xl flex items-center gap-2 select-none cursor-pointer transition ${
                copiedLink ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              {copiedLink ? "Copied Link!" : "Copy Link"}
            </button>
            <button
              onClick={() => onViewStore(business.slug)}
              className="px-4 py-2 text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 shadow"
            >
              Go to Storefront <ExternalLink className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </header>

        {/* TAB 1: INSIGHTS & ANALYTICS */}
        {activeTab === "insights" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 print:hidden">
            
            {/* SaaS Banner helper for Free plan */}
            {business.plan === "FREE" && (
              <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="space-y-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider block w-fit">
                    💥 Upgrade Premium Sparkle
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    Get Unlimited Products, Analytics graphs, custom print sizes, and watermarks removal!
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Join over 4,500+ small boutiques, kitchens & local stores scaling with Catalogly Premium.
                  </p>
                </div>
                <button
                  onClick={() => alert("Payment popup request has been triggered! Standard Razorpay checkout ₹499/month is active in live sandbox mode.")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow self-start sm:self-center whitespace-nowrap cursor-pointer"
                >
                  Upgrade ₹499/mo
                </button>
              </div>
            )}

            {/* Metric widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Store Views</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{business.views}</p>
                <div className="mt-3 flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                  <span>📈 +18%</span> <span className="text-slate-400 font-normal">this week</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Products</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{products.length}</p>
                <div className="mt-3 text-[9px] text-slate-400 flex items-center gap-1">
                  <span className="font-bold text-slate-600">Limit:</span> {business.plan === "FREE" ? "15 Max" : "Unlimited"}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Orders Count</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{orders.length}</p>
                <div className="mt-3 flex items-center gap-1 text-[9px] text-indigo-500 font-bold">
                  <span>📦 {orders.filter((o) => o.status === "NEW").length} NEW</span> <span className="text-slate-400 font-normal">pending</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Revenue Earned</span>
                <p className="text-3xl font-black text-slate-900 mt-2">
                  ₹{orders.filter((o) => o.status === "COMPLETED").reduce((sum, o) => sum + o.totalAmount, 0)}
                </p>
                <div className="mt-3 flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                  <span>💰 COD + UPI</span> <span className="text-slate-400 font-normal">registered</span>
                </div>
              </div>
            </div>

            {/* Simple Graphic Trends / Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Trend Chart Mockup using clean SVG shapes */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Business Analytics Graph</h4>
                    <p className="text-[10px] text-slate-400">Weekly traffic and order conversion rates</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">Past 7 days</span>
                </div>

                {/* Micro SVG graph representation */}
                <div className="h-44 w-full bg-slate-50 rounded-xl relative p-4 flex items-end justify-between border border-slate-100">
                  <div className="absolute top-2 left-3 flex items-center gap-4 text-[9px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Views (Visitors)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" /> WhatsApp Clicks (Orders)
                    </span>
                  </div>

                  {/* Vertical graph columns */}
                  {[
                    { day: "Mon", v: 40, o: 10 },
                    { day: "Tue", v: 65, o: 15 },
                    { day: "Wed", v: 50, o: 8 },
                    { day: "Thu", v: 90, o: 25 },
                    { day: "Fri", v: 80, o: 20 },
                    { day: "Sat", v: 120, o: 45 },
                    { day: "Sun", v: 135, o: 55 },
                  ].map((x, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full flex justify-center items-end gap-1.5 h-28 max-w-[40px]">
                        <div style={{ height: `${x.v / 1.5}%` }} className="w-2.5 rounded-t bg-emerald-400/80 hover:bg-emerald-500 transition-all cursor-pointer" title={`Views: ${x.v}`} />
                        <div style={{ height: `${x.o * 1.5}%` }} className="w-2.5 rounded-t bg-indigo-400/80 hover:bg-indigo-500 transition-all cursor-pointer" title={`Orders: ${x.o}`} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold tracking-tight">{x.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Products widgets */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Top Catalogs</h4>
                  <p className="text-[10px] text-slate-400">Most clicked/viewed products</p>
                </div>

                <div className="space-y-3">
                  {products.slice(0, 3).map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-50 bg-slate-50/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-slate-400 w-4 font-mono">{idx + 1}.</span>
                        <img src={p.image} className="w-8 h-8 rounded-md object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">{p.name}</p>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest">{p.category}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-600 bg-white border px-2 py-0.5 rounded-full select-none shrink-0 whitespace-nowrap">
                        ₹{p.price}
                      </span>
                    </div>
                  ))}

                  {products.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center italic">No products registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PRODUCT MANAGER */}
        {activeTab === "products" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Your Product Catalog ({products.length})</h3>
                <p className="text-xs text-slate-500">Edit elements, manage custom variant parameters, and adjust inventory rankings.</p>
              </div>
              <button
                onClick={openAddProductModal}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-4 font-extrabold text-xs flex items-center gap-1 shadow cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {/* Product items table */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto min-w-full">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider text-left">
                      <th className="py-4 px-6 w-16">Sort</th>
                      <th className="py-4 px-6">Product</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Price</th>
                      <th className="py-4 px-6">Stock Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                    {products.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => reorderProduct(idx, "up")}
                              className={`p-1 rounded hover:bg-slate-200 text-slate-500 ${idx === 0 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === products.length - 1}
                              onClick={() => reorderProduct(idx, "down")}
                              className={`p-1 rounded hover:bg-slate-200 text-slate-500 ${idx === products.length - 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <img src={p.image} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80' }} />
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 truncate">{p.name}</p>
                              {p.variants && p.variants.length > 0 && (
                                <span className="text-[9px] text-slate-400 font-bold block">
                                  Variants: {p.variants.map((v) => v.name).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-semibold">
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-indigo-100 select-none">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          {p.discountPrice ? (
                            <div className="flex flex-col">
                              <span className="font-black">₹{p.discountPrice}</span>
                              <span className="text-[10px] text-slate-400 line-through">₹{p.price}</span>
                            </div>
                          ) : (
                            <span>₹{p.price}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.stockStatus === "IN_STOCK" ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-rose-50 text-rose-700 font-semibold"
                          }`}>
                            {p.stockStatus === "IN_STOCK" ? "● In Stock" : "○ Out of stock"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 inline-flex transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-rose-500 hover:text-rose-700 inline-flex transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {products.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                          No products registered on database. Start adding your first shop inventory items now!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CUSTOMER ORDERS */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 print:hidden">
            <div>
              <h3 className="text-base font-black text-slate-900">Registered Customers Orders ({orders.length})</h3>
              <p className="text-xs text-slate-500">Review WhatsApp compiled notifications and update checkout payment statuses on the fly.</p>
            </div>

            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-5 space-y-4">
                  {/* Title Bar status */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4 border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-full">
                        #{o.id}
                      </span>
                      <span className="text-slate-400 font-bold text-xs">
                        {new Date(o.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 shrink-0 select-none">
                      {/* Active Status Badge indicator */}
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                        o.status === "NEW" ? "bg-amber-100 text-amber-700" : o.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        Order: {o.status}
                      </span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                        o.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        Payment: {o.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Customer Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Customer Details</p>
                      <h5 className="font-extrabold text-slate-800">{o.customerName}</h5>
                      <p className="text-slate-500 font-medium mt-0.5">Contact: +91 {o.customerPhone}</p>
                    </div>

                    {o.customerAddress && (
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Delivery Address</p>
                        <p className="text-slate-600 font-semibold">{o.customerAddress}</p>
                      </div>
                    )}
                  </div>

                  {/* Invoice listing */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Items Summary</p>
                    <div className="divide-y divide-slate-100">
                      {o.items.map((item, index) => (
                        <div key={index} className="py-2 flex justify-between text-xs font-semibold text-slate-800">
                          <div>
                            <span className="text-slate-900 font-black">{item.name}</span>
                            <span className="text-slate-400 italic"> x{item.qty}</span>
                            {item.variantStr && <span className="block text-[10px] text-slate-400 font-normal">({item.variantStr})</span>}
                          </div>
                          <span>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-200/50 pt-2 flex justify-between text-slate-900 font-extrabold text-xs">
                      <span>Total Invoice</span>
                      <span>₹{o.totalAmount}</span>
                    </div>
                  </div>

                  {/* Quick trigger actions */}
                  <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
                    <a
                      href={`https://wa.me/${o.customerPhone}?text=${encodeURIComponent("Hello " + o.customerName + ", we received your Order #" + o.id + " at our store " + business.name + ". Total comes to ₹" + o.totalAmount + ". We are packaging it now!")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Chat Customer
                    </a>

                    <div className="flex gap-1.5 shrink-0">
                      {o.status === "NEW" && (
                        <button
                          onClick={() => updateOrder(o.id, "COMPLETED", "PAID")}
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 px-4 font-black text-xs transition select-none cursor-pointer"
                        >
                          Mark Finished & Paid
                        </button>
                      )}
                      {o.status !== "CANCELLED" && (
                        <button
                          onClick={() => updateOrder(o.id, "CANCELLED", "PENDING")}
                          className="border hover:bg-rose-50 hover:text-rose-700 rounded-xl py-2 px-4 font-bold text-xs text-slate-500 transition cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <div className="bg-white border rounded-2xl py-12 px-4 shadow-sm text-center">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-semibold italic">No customer orders received yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: STORE SETTINGS / BRAND CUSTOMIZER */}
        {activeTab === "design" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 print:hidden">
            <div>
              <h3 className="text-base font-black text-slate-900">Branding & Store Profile Controls</h3>
              <p className="text-xs text-slate-500">Update business details, WhatsApp contacts, UPI profiles, and select custom visual design themes.</p>
            </div>

            {savedSuccessMessage && (
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-800 font-bold rounded-xl shadow-sm">
                {savedSuccessMessage}
              </div>
            )}

            <form onSubmit={handleSaveProfileSettings} className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
              
              {/* Profile details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    दुकान का नाम / Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    शॉप कस्टमाइज्ड लिंक / Store Web Address
                  </label>
                  <div className="flex rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-slate-50">
                    <span className="inline-flex items-center px-3.5 bg-slate-100 text-slate-500 text-xs font-mono">
                      /store/
                    </span>
                    <input
                      type="text"
                      required
                      value={profileSlug}
                      onChange={(e) => setProfileSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="flex-1 min-w-0 text-slate-800 px-3 py-2 border-l border-slate-200 focus:outline-none font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  विवरण / Business Description (Short Bio)
                </label>
                <textarea
                  rows={2}
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-semibold"
                />
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    व्हाट्सएप नंबर / Indian WhatsApp Phone
                  </label>
                  <div className="relative rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
                    <span className="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-slate-700 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 text-slate-800 px-4 py-2.5 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    पेमेंट यूपीआई आईडी / Merchant UPI ID (GPay/PhonePe target)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. storename@okpay"
                    value={profileUpi}
                    onChange={(e) => setProfileUpi(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono tracking-wide font-bold"
                  />
                </div>
              </div>

              {/* More social info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    इंस्टाग्राम यूजरनेम / Instagram Link (Without @)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. kiran_wear_jaipur"
                    value={profileInstagram}
                    onChange={(e) => setProfileInstagram(e.target.value.trim())}
                    className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    पिकअप का पता / Store Pickup Address (Full Location)
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-semibold"
                  />
                </div>
              </div>

              {/* Select Theme Preset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  स्टोर कलर ब्रांडिंग थीम / Select Visual Brand Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setProfileThemeId(t.id)}
                      className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                        profileThemeId === t.id
                          ? "border-slate-950 bg-slate-50 ring-2 ring-slate-950/20"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${t.preview} shadow-sm border border-black/10`} />
                      <span className="text-[10px] font-bold text-slate-800">{t.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-950 text-white py-3.5 rounded-2xl text-xs font-extrabold tracking-widest cursor-pointer shadow hover:bg-slate-800 mt-2 hover:opacity-95"
              >
                सेटिंग्स सुरक्षित करें / SAFEGUARD STORE SETTINGS
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB 5: PDF PRINT CATALOG STUDIO */}
        {activeTab === "pdf" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Options configuration block (invisible during print!) */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
              <div>
                <h3 className="text-base font-black text-slate-900">A4 Printable Custom Catalog Builder</h3>
                <p className="text-xs text-slate-500">Auto-render beautiful minimal printable price lists featuring custom contact QR codes pointing directly to your storefront URL.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Print filters */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Category Filter</label>
                  <select
                    value={pdfFilterCategory}
                    onChange={(e) => setPdfFilterCategory(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white text-slate-700 font-bold"
                  >
                    {availableCategoriesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Display Options</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfShowDiscount}
                      onChange={(e) => setPdfShowDiscount(e.target.checked)}
                      className="rounded border-slate-300 w-4 h-4 text-emerald-500"
                    /> Show Discount Price
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Store QR Codes</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfShowQR}
                      onChange={(e) => setPdfShowQR(e.target.checked)}
                      className="rounded border-slate-300 w-4 h-4 text-emerald-500"
                    /> Show Scan Link QR Code
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={triggerWindowPrintAction}
                  className="bg-slate-900 border text-white rounded-xl py-3 px-6 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer className="w-4.5 h-4.5 text-white" /> Open Browser print (Or Save as PDF)
                </button>
                <div className="text-slate-400 text-[10px] font-semibold flex items-center leading-tight">
                  💡 Tip: Set Layout to Portrait & background graphics checked in your printer dialog for a pristine result!
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW FLYER BOARD (This gets isolated during window.print!) */}
            <div id="catalog-pdf-printed-sheet" className="p-8 sm:p-12 bg-white border border-slate-200/80 rounded-3xl shadow-md max-w-[210mm] mx-auto space-y-8 flex flex-col justify-between aspect-[1/1.414]">
              <div className="space-y-8">
                {/* Visual Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 border-slate-900/10">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-950 tracking-tight">{business.name}</h1>
                    <p className="text-xs text-slate-500 font-semibold max-w-md">{business.description}</p>
                    {business.address && <p className="text-[10px] text-slate-400 font-bold">📍 Address: {business.address}</p>}
                  </div>

                  {pdfShowQR && (
                    <div className="flex flex-col items-center gap-1.5 shrink-0 bg-slate-50 border p-3.5 rounded-2xl">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + "/store/" + business.slug)}`}
                        alt="Store QR Link"
                        className="w-20 h-20"
                      />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Scan to Go Live</span>
                    </div>
                  )}
                </div>

                {/* Printable catalog products table */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">Product Inventory Price List</h3>
                  <div className="border border-slate-900/10 rounded-2xl overflow-hidden">
                    <table className="min-w-full border-collapse text-left text-xs bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-900/10 text-slate-500 font-black text-[9px] uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Item Details</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 w-28 text-right">Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {printableProductsFiltered.map((p, idx) => {
                          const hasDisc = pdfShowDiscount && p.discountPrice !== null;
                          return (
                            <tr key={p.id}>
                              <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <p>{p.name}</p>
                                <span className="text-[9px] text-slate-400 font-normal line-clamp-1">{p.description}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="p-1 bg-slate-50 border border-slate-100 uppercase font-black text-[8px] rounded block w-fit text-slate-500">
                                  {p.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-950">
                                {hasDisc ? (
                                  <div>
                                    <span>₹{p.discountPrice} </span>
                                    <span className="text-[9px] text-slate-400 line-through">₹{p.price}</span>
                                  </div>
                                ) : (
                                  <span>₹{p.price}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {printableProductsFiltered.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-400 italic">No products matched catalog criteria.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Brand and contact info footer details */}
              <div className="border-t border-slate-200/60 pt-6 flex flex-col sm:flex-row justify-between text-slate-500 text-[10px] font-bold gap-3 items-center">
                <span>Created via <b>Catalogly.app</b> ⚡ Make Store in 1 Minute</span>
                <div className="flex gap-4 shrink-0 text-slate-800">
                  <span>📱 Contact: +91 {business.whatsappNum.replace(/^91/, "")}</span>
                  {business.upiId && <span>💵 UPI: {business.upiId}</span>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* FORM MODAL AREA: ADD/EDIT PRODUCT (Floating AnimatePresence) */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto p-4 flex justify-center items-center print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-xl w-full flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Catalogly Inventory</h4>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {isEditingProduct ? "Edit Store Product Parameters" : "Register New Custom Product Item"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal form scroll */}
              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* General name */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide mb-1 text-slate-600">
                    उत्पाद का नाम / Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="उदा. Banarasi Silk Saree, Tandoori Butter Roti"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-bold"
                  />
                </div>

                {/* Sub category */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide mb-1 text-slate-600">
                    श्रेणी / Category
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      placeholder="e.g. Sarees, Sweets, Breads"
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="flex-1 text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-bold"
                    />
                    <select
                      onChange={(e) => setPCategory(e.target.value)}
                      className="p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-700 font-bold"
                    >
                      <option value="">Choose category</option>
                      {business.categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide mb-1 text-slate-600">
                      कीमत / Original Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 1000"
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-955 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide mb-1 text-slate-600">
                      ऑफर कीमत / Discount Price (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 799"
                      value={pDiscountPrice}
                      onChange={(e) => setPDiscountPrice(e.target.value)}
                      className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-955 font-bold"
                    />
                  </div>
                </div>

                {/* Visual Image Loader */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide mb-1 text-slate-600">
                    उत्पाद का फोटो / Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {pImageBase64 ? (
                        <img src={pImageBase64} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-slate-300">🖼️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Upload a beautiful PNG or JPEG. Will be automatically optimized.</p>
                    </div>
                  </div>
                </div>

                {/* Gemini intelligent helper details */}
                <div className="bg-slate-50 border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Gemini AI Copy-Creator Assistant</span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    Let Google's highly advanced Gemini AI formulate appealing, professional, sales-driven copy for local Indian shops in seconds!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400">Merchant custom remarks / notes</span>
                      <input
                        type="text"
                        placeholder="e.g. pure hand-woven, organic material"
                        value={aiNotes}
                        onChange={(e) => setAiNotes(e.target.value)}
                        className="w-full text-slate-800 text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400">Vibe Selection</span>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white text-[10px] font-bold text-slate-700"
                      >
                        <option value="Warm, inviting, and traditional">Warm & inviting (Sarees/ethnic)</option>
                        <option value="Fresh, delicious and crispy">Fresh & appetizing (Kitchen/food)</option>
                        <option value="Modern, sleek and luxurious">Sleek & high-end (Cosmetics/luxury)</option>
                        <option value="Humble, friendly and simple">Simple & local store (Kirana/daily)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={handleGenerateAiDescription}
                    className="bg-indigo-600 hover:bg-indigo-700 font-extrabold text-[10px] text-white py-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start shadow"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> Generating product copy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> ✨ Suggest Description with AI
                      </>
                    )}
                  </button>
                </div>

                {/* Sub details */}
                <div>
                  <label className="block text-xs font-bold text-slate-705 uppercase tracking-wide mb-1 text-slate-600">
                    विवरण / Product Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about sizing, material finishes, or special box packaging here."
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 font-semibold"
                  />
                </div>

                {/* Sizing/Colors Variant Builders */}
                <div className="border-t pt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Custom Sizing / Color Options</span>
                  
                  {variantsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-1 select-none">
                      {variantsList.map((v, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-100 text-[10px] text-slate-700 font-bold py-1 px-2.5 rounded-lg border border-slate-200">
                          <span>{v.name}: {v.options.join(", ")}</span>
                          <button type="button" onClick={() => removeVariantIndex(i)} className="text-rose-500 hover:text-rose-700 font-bold font-sans">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50 border rounded-2xl p-3 flex gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="e.g. Size, Color"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      className="w-1/3 px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Options separate by commas (S, M, L)"
                      value={newVarOptions}
                      onChange={(e) => setNewVarOptions(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold"
                    />
                    <button
                      type="button"
                      onClick={addProductVariant}
                      className="bg-slate-900 text-white rounded-lg px-3 py-1 text-[10px] font-bold"
                    >
                      Add option
                    </button>
                  </div>
                </div>

                {/* Stock Selector Toggle */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 select-none">
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase block tracking-wider leading-none">Stock Status</span>
                    <span className="text-[10px] text-slate-400 mt-1">Make item hide shopping cart triggers if Out Of Stock.</span>
                  </div>

                  <div className="flex rounded-xl shadow-sm border overflow-hidden text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPStock("IN_STOCK")}
                      className={`px-4 py-2 ${pStock === "IN_STOCK" ? "bg-emerald-500 text-white" : "bg-white hover:bg-slate-50 text-slate-700"}`}
                    >
                      In Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setPStock("OUT_OF_STOCK")}
                      className={`px-4 py-2 ${pStock === "OUT_OF_STOCK" ? "bg-rose-500 text-white" : "bg-white hover:bg-slate-50 text-slate-700"}`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingProduct(false)}
                    className="w-1/3 border border-slate-200 text-slate-700 rounded-xl py-3.5 hover:bg-slate-50 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-950 text-white rounded-xl py-3.5 hover:bg-slate-800 font-extrabold text-xs shadow tracking-wider"
                  >
                    दुकान में जोड़ें / DEPLOY PRODUCT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
