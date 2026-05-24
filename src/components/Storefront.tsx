/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, Search, Phone, ChevronRight, X, Plus, Minus, 
  Check, CreditCard, Sparkles, MapPin, ExternalLink, ArrowLeft 
} from "lucide-react";
import { Business, Product, OrderItem, Order } from "../types";
import { THEME_PRESETS } from "../data/seedData";

interface StorefrontProps {
  business: Business;
  products: Product[];
  onBackToAdmin?: () => void; // Optional button back to dashboard if they are previewing
  isDemoMode?: boolean;
}

export default function Storefront({ business, products, onBackToAdmin, isDemoMode = false }: StorefrontProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [productIdAndVariant: string]: { product: Product; qty: number; variantStr?: string } }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeVariantProduct, setActiveVariantProduct] = useState<Product | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<{ [variantName: string]: string }>({});

  // Checkout form credentials
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH_ON_DELIVERY">("UPI");
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Theme settings
  const theme = useMemo(() => {
    return THEME_PRESETS.find((t) => t.id === business.themeId) || THEME_PRESETS[0];
  }, [business.themeId]);

  // List of custom categories
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return ["All", ...Array.from(list)];
  }, [products]);

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Total amount and unique item counts
  const { cartItemsList, cartTotal, cartQty } = useMemo(() => {
    const list = Object.values(cart) as { product: Product; qty: number; variantStr?: string }[];
    const total = list.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.qty;
    }, 0);
    const qtyCount = list.reduce((sum, item) => sum + item.qty, 0);
    return { cartItemsList: list, cartTotal: total, cartQty: qtyCount };
  }, [cart]);

  // Handle Add Click (either launches variant selector, or adds immediately)
  const handleAddToCartClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setActiveVariantProduct(product);
      // Pre-select first option for each variant
      const initial: { [key: string]: string } = {};
      product.variants.forEach((v) => {
        if (v.options.length > 0) initial[v.name] = v.options[0];
      });
      setSelectedVariants(initial);
    } else {
      addToCartDirect(product);
    }
  };

  const addToCartDirect = (product: Product, variantStr?: string) => {
    const key = product.id + (variantStr ? `:${variantStr}` : "");
    setCart((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: {
          product,
          qty: existing ? existing.qty + 1 : 1,
          variantStr,
        },
      };
    });
  };

  const updateCartQty = (key: string, amount: number) => {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const newQty = existing.qty + amount;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { ...existing, qty: newQty },
      };
    });
  };

  const confirmVariantSelections = () => {
    if (!activeVariantProduct) return;
    const variantStr = Object.entries(selectedVariants)
      .map(([name, opt]) => `${name}: ${opt}`)
      .join(", ");
    addToCartDirect(activeVariantProduct, variantStr);
    setActiveVariantProduct(null);
  };

  // Build the live payment URL and click messages
  const checkoutOrder = async () => {
    if (!customerName || !customerPhone) {
      alert("Please fill in your name and phone number to complete the order.");
      return;
    }
    setLoading(true);

    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const orderItemsList: OrderItem[] = cartItemsList.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      qty: item.qty,
      price: item.product.discountPrice || item.product.price,
      variantStr: item.variantStr,
    }));

    const orderPayload: Order = {
      id: orderId,
      businessId: business.id,
      items: orderItemsList,
      totalAmount: cartTotal,
      customerName,
      customerPhone,
      customerAddress: customerAddress.trim() || undefined,
      paymentMethod,
      paymentStatus: paymentMethod === "UPI" ? "PENDING" : "PENDING",
      status: "NEW",
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Submit order to JSON database via API
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      // Increment visitor order view analytics on storefront preview
      await fetch(`/api/business/${business.id}/view`, { method: "POST" });

      // Generate WhatsApp Direct link
      let msg = `*🛍️ New Order - ${business.name}*\n`;
      msg += `--------------------------\n`;
      msg += `*Order ID:* #${orderId}\n`;
      msg += `*Customer:* ${customerName}\n`;
      msg += `*Phone:* +91 ${customerPhone}\n`;
      if (customerAddress) {
        msg += `*Address:* ${customerAddress}\n`;
      }
      msg += `--------------------------\n`;
      msg += `*Items ordered:*\n`;
      
      orderItemsList.forEach((item, idx) => {
        const varInfo = item.variantStr ? ` (${item.variantStr})` : "";
        msg += `• ${item.name} x${item.qty}${varInfo} - ₹${item.price * item.qty}\n`;
      });
      
      msg += `--------------------------\n`;
      msg += `*Total Amount:* ₹${cartTotal}\n`;
      msg += `*Payment:* ${paymentMethod === "UPI" ? "⚡ Pay via UPI" : "💵 Cash on Delivery (COD)"}\n\n`;
      msg += `Please confirm my order. Thank you! 🙏`;

      const whatsappUrl = `https://wa.me/${business.whatsappNum}?text=${encodeURIComponent(msg)}`;
      
      setOrderPlaced({
        orderId,
        whatsappUrl,
        upiUrl: business.upiId ? `upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${cartTotal}&cu=INR&tn=${encodeURIComponent("Order " + orderId)}` : null,
      });

      // Clear Cart
      setCart({});
    } catch (err) {
      console.error("Failed to post order", err);
      alert("Order placement failed. Retrying manually via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-24">
      {/* Back to admin bar */}
      {onBackToAdmin && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1.5 opacity-90">
            <Sparkles className="w-4.5 h-4.5 text-yellow-400" />
            {isDemoMode ? "Storefront Preview Mode" : "This is your Live Store URL"}
          </span>
          <button
            onClick={onBackToAdmin}
            className="bg-white/10 hover:bg-white/25 border border-white/20 px-3 py-1 rounded-full font-bold transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Panel
          </button>
        </div>
      )}

      {/* Hero Cover Header */}
      <header className="bg-white border-b border-slate-100 flex flex-col items-center pt-8 pb-6 px-4 relative">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-3xl shadow-sm border border-slate-100 mb-3 flex items-center justify-center">
          {business.logo || "🛍️"}
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight text-center">
          {business.name}
        </h1>
        <p className="mt-1 text-xs text-slate-500 max-w-sm text-center leading-relaxed">
          {business.description || "The finest items, curated & delivered directly at your doorstep."}
        </p>

        {business.address && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{business.address}</span>
          </div>
        )}

        {/* Brand visual details */}
        <div className="mt-4 flex gap-4 text-xs font-semibold text-slate-700">
          <a
            href={`https://wa.me/${business.whatsappNum}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:underline"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            WhatsApp Chat
          </a>
          {business.instagram && (
            <a
              href={`https://instagram.com/${business.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-pink-600 hover:underline"
            >
              <span>📸</span>
              Instagram
            </a>
          )}
        </div>
      </header>

      {/* Main Container body */}
      <main className="max-w-2xl w-full mx-auto px-4 mt-6 flex-1">
        {/* Search Input */}
        <div className="relative rounded-xl shadow-sm bg-white border border-slate-200 flex items-center overflow-hidden">
          <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-slate-800 px-3 py-3 text-sm focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Category Horizontal Bar */}
        <div className="mt-4 overflow-x-auto flex gap-1.5 py-1 no-scrollbar">
          {categoriesList.map((cat) => {
            const isActive = selectedCategory === cat;
            const styleBg = isActive ? "text-white" : "bg-slate-200/50 hover:bg-slate-200 text-slate-700";
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={isActive ? { backgroundColor: theme.primary } : {}}
                className={`px-4 py-2 rounded-full font-bold text-xs select-none whitespace-nowrap cursor-pointer transition ${styleBg}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid Items */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
            Products ({filteredProducts.length})
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border rounded-2xl py-12 px-4 shadow-sm text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-semibold">No products found matching filters.</p>
              <button
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="mt-2 text-xs text-indigo-500 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((p) => {
                const discount = p.discountPrice && p.discountPrice < p.price ? p.price - p.discountPrice : 0;
                const percentOff = discount ? Math.round((discount / p.price) * 100) : 0;
                const outOfStock = p.stockStatus === "OUT_OF_STOCK";

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition duration-150 relative"
                  >
                    {/* Discount Badge */}
                    {percentOff > 0 && !outOfStock && (
                      <span className="absolute top-2 left-2 z-1 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full">
                        {percentOff}% Off
                      </span>
                    )}

                    {/* Image Container */}
                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={p.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80"}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition duration-300 ${outOfStock ? "opacity-40 grayscale" : "hover:scale-105"}`}
                      />
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <span className="bg-slate-900/95 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded">
                            Out Of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        {p.category && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                            {p.category}
                          </span>
                        )}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={p.name}>
                          {p.name}
                        </h4>
                        <p className="mt-1 text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-slate-900">
                            ₹{p.discountPrice || p.price}
                          </span>
                          {p.discountPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{p.price}
                            </span>
                          )}
                        </div>

                        {/* Add to Cart button */}
                        <button
                          disabled={outOfStock}
                          onClick={() => handleAddToCartClick(p)}
                          style={!outOfStock ? { backgroundColor: theme.primary } : {}}
                          className={`w-full mt-3 py-2 rounded-xl text-xs font-extrabold text-white transition flex items-center justify-center gap-1 ${
                            outOfStock ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> ADD TO CART
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Bar (Float Cart Trigger) */}
      {cartQty > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-100 py-3.5 px-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: theme.primary }}
            className="max-w-md w-full mx-auto flex items-center justify-between text-white p-4 rounded-2xl shadow-md whitespace-nowrap font-extrabold text-sm tracking-wide hover:opacity-95 transition"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5" />
              <span className="bg-white/20 text-white rounded-full px-2 py-0.5 text-xs">
                {cartQty}
              </span>
              <span>Checkout Cart</span>
            </div>
            <div className="flex items-center gap-1 font-black">
              <span>View Cart (₹{cartTotal})</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer Sliding Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-800" />
                  <span className="font-extrabold text-slate-900">Checkout Basket</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItemsList.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                    <p className="font-bold text-xs">Empty basket. Add products first!</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Basket Items
                    </h4>
                    {cartItemsList.map((item) => {
                      const key = item.product.id + (item.variantStr ? `:${item.variantStr}` : "");
                      const price = item.product.discountPrice || item.product.price;
                      return (
                        <div
                          key={key}
                          className="border border-slate-100 rounded-xl p-3 flex gap-3 bg-slate-50"
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 truncate">
                              {item.product.name}
                            </h5>
                            {item.variantStr && (
                              <p className="text-[10px] text-slate-400 font-semibold italic">
                                {item.variantStr}
                              </p>
                            )}
                            <p className="mt-1 text-xs font-black text-slate-900">
                              ₹{price} <span className="text-[10px] font-normal text-slate-400">ea</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 select-none border rounded-lg bg-white overflow-hidden p-1">
                            <button
                              onClick={() => updateCartQty(key, -1)}
                              className="p-1 hover:bg-slate-50 text-slate-500"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-slate-800 w-4 text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(key, 1)}
                              className="p-1 hover:bg-slate-50 text-slate-500"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Customer Info Form */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Delivery Credentials
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          आपका नाम / Your Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          मोबाइल नंबर / Active Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                          className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          डिलीवरी का पता / Shipping Address (Landmarks, Pin)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Please specify full address with landmark"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full text-slate-800 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-semibold"
                        />
                      </div>

                      {/* Payment Method Switcher */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                          भुगतान विधि / Payment Gateway Choice
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Direct UPI */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("UPI")}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                              paymentMethod === "UPI"
                                ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 font-bold"
                                : "border-slate-100 bg-white"
                            }`}
                          >
                            <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-extrabold">Instant UPI (Paytm/GPay)</span>
                          </button>

                          {/* Cash on delivery */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                              paymentMethod === "CASH_ON_DELIVERY"
                                ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 font-bold"
                                : "border-slate-100 bg-white"
                            }`}
                          >
                            <span className="text-base shrink-0">💵</span>
                            <span className="text-[10px] font-extrabold">Cash on Delivery (COD)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sticky bottom buttons */}
              {cartItemsList.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between text-slate-800 font-bold text-sm">
                    <span>Order Total</span>
                    <span className="font-extrabold text-slate-950 text-base">₹{cartTotal}</span>
                  </div>

                  <button
                    disabled={loading}
                    onClick={checkoutOrder}
                    style={{ backgroundColor: theme.primary }}
                    className="w-full py-3.5 rounded-2xl text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow hover:opacity-90"
                  >
                    {loading ? (
                      "Saving Order details..."
                    ) : (
                      <>
                        चैट पर आर्डर भेजें / ORDER VIA WHATSAPP <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Variant Drawer Modal */}
      <AnimatePresence>
        {activeVariantProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-900">{activeVariantProduct.name}</h4>
                  <p className="text-xs text-slate-500 font-bold">Configure options before adding</p>
                </div>
                <button
                  onClick={() => setActiveVariantProduct(null)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeVariantProduct.variants.map((v) => (
                <div key={v.name} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    {v.name}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {v.options.map((opt) => {
                      const isSel = selectedVariants[v.name] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                          style={isSel ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
                          className={`px-3 py-1.5 text-xs font-bold border rounded-lg transition ${
                            isSel ? "text-white" : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={confirmVariantSelections}
                style={{ backgroundColor: theme.primary }}
                className="w-full text-white py-3.5 rounded-2xl font-black text-xs hover:opacity-90 transition shadow mt-2"
              >
                CONFIRM VARIANT & ADD TO BASKET
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Complete Success Backdrop Modal details */}
      <AnimatePresence>
        {orderPlaced && (
          <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-6"
            >
              {/* Checkmark icon */}
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                  Order Registered Successfully!
                </span>
                <h3 className="text-xl font-black text-slate-950">
                  Your Order ID is #{orderPlaced.orderId}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  आपके ऑर्डर की जानकारी हमारे डेटाबेस में सुरक्षित हो गई है। order पूरा करने के लिए नीचे दिए बटन पर क्लिक करें!
                </p>
              </div>

              {/* UPI Payment Gateway QR panel */}
              {paymentMethod === "UPI" && orderPlaced.upiUrl && (
                <div className="border border-slate-100 bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-3">
                  <div className="text-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wide block">
                      ⚡ UPI Scan to Pay Center
                    </span>
                    <p className="text-[11px] font-bold text-slate-700">Scan with GPay, PhonePe, Paytm or BHIM</p>
                  </div>

                  {/* High Quality Public API QR Code Generation */}
                  <div className="p-3 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(orderPlaced.upiUrl)}`}
                      alt="UPI Checkout QR Code"
                      className="w-40 h-40"
                    />
                  </div>

                  <a
                    href={orderPlaced.upiUrl}
                    className="bg-slate-900 border border-slate-700 font-extrabold text-[11px] text-white py-2 px-4 rounded-xl flex items-center gap-1 hover:bg-slate-800 transition"
                  >
                    Mobile: Tap to Pay on UPI app <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </a>
                </div>
              )}

              {/* Prompt redirection instructions */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 py-2.5 px-3 rounded-xl border border-indigo-100 flex items-center gap-2 justify-center leading-relaxed">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  Your invoice has been compiled. You must tap below to trigger the prefilled WhatsApp text!
                </p>

                <div className="flex flex-col gap-2">
                  <a
                    href={orderPlaced.whatsappUrl}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <span>💬</span>
                    COMPLETE ORDER ON WHATSAPP
                  </a>
                  
                  <button
                    onClick={() => setOrderPlaced(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold tracking-wide mt-2"
                  >
                    Explore other products
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
