/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import {
  MessageSquare,
  CreditCard,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Printer,
  ShoppingBag,
  Eye,
} from "lucide-react";

import type { Business } from "../types";
import { DEFAULT_BUSINESSES, DEFAULT_PRODUCTS } from "../data/seedData";

interface LandingPageProps {
  onCreateStore: () => void;
  onSelectBusinessDemo: (business: Business) => void;
}

export default function LandingPage({
  onCreateStore,
  onSelectBusinessDemo,
}: LandingPageProps) {
  const [activeDemoId, setActiveDemoId] = useState<string>("biz-1");

  const activeBiz = useMemo(() => {
    return (
      DEFAULT_BUSINESSES.find((b) => b.id === activeDemoId) ??
      DEFAULT_BUSINESSES[0]
    );
  }, [activeDemoId]);

  const activeProducts = useMemo(() => {
    return DEFAULT_PRODUCTS.filter(
      (product) => product.businessId === activeBiz.id
    );
  }, [activeBiz]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const getSectorText = () => {
    if (activeBiz.slug.includes("couture")) {
      return "Jaipur Boutique / Sarees";
    }

    if (activeBiz.slug.includes("tadka")) {
      return "Cloud Kitchen / Curry";
    }

    return "Clay Pottery Studio";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* GLOBAL NAVIGATION HEADER */}
      <nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="select-none text-2xl">🛍️</span>

            <span className="text-xl font-black tracking-tight text-slate-900">
              Catalogly
              <span className="text-emerald-500">.app</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="cursor-pointer text-xs font-bold text-slate-500 transition hover:text-slate-950"
            >
              How it works
            </button>

            <button
              type="button"
              onClick={onCreateStore}
              className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-center text-xs font-extrabold text-white shadow transition hover:bg-slate-800"
            >
              Create My Store (दुकान चालू करें)
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-20 pt-16 text-center sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="mx-auto max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Made with love for Indian Merchant Houses 🇮🇳
          </span>

          <h1 className="text-4xl font-black leading-none tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Your Premium Digital Storefront Live in{" "}
            <span className="text-emerald-500">
              Under 1 Minute
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Create beautifully structured catalogues, collect direct UPI
            payments without transaction cuts, and dispatch order summaries
            pre-filled straight into your customer&apos;s WhatsApp inbox!
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onCreateStore}
              className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white shadow-md transition hover:bg-emerald-700 sm:w-auto"
            >
              Start Free Store Now

              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("demo-interactive")}
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Try Interactive Demos
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-emerald-500" />
              No Coding Barrier
            </span>

            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-emerald-500" />
              Zero Payment Commission
            </span>

            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-emerald-500" />
              A4 PDF Catalogs included
            </span>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 md:mx-0">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              WhatsApp Automatons
            </h3>

            <p className="text-xs leading-relaxed text-slate-400">
              When shoppers checkout, we generate structured, pre-assembled
              invoices directly in their chat. Confirm orders, discuss
              addresses, and deliver with 1 click!
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 md:mx-0">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Direct Commission-Free UPI
            </h3>

            <p className="text-xs leading-relaxed text-slate-400">
              Generate dynamic scan-to-order QR codes pointing to your GPay,
              PhonePe, or Paytm account instantly. Get 100% money credited
              directly to your bank account with zero middleman fee.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 md:mx-0">
              <Printer className="h-6 w-6 text-emerald-600" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Printable A4 Catalogues
            </h3>

            <p className="text-xs leading-relaxed text-slate-400">
              Instantly compile beautiful, minimal A4 price brochures complete
              with merchant branding, categories, custom discount rates, and
              interactive checkout QR codes for offline scanning!
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMOS */}
      <section
        id="demo-interactive"
        className="border-y border-slate-100 bg-white py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2 text-center">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              Live Store Selector
            </span>

            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Select & Preview Real Indian Stores
            </h2>

            <p className="mx-auto max-w-md text-xs text-slate-500">
              Choose a business sector below. See the exact customized live
              storefront and experience the checkout flow.
            </p>
          </div>

          {/* STORE TABS */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {DEFAULT_BUSINESSES.map((business) => (
              <button
                key={business.id}
                type="button"
                onClick={() => setActiveDemoId(business.id)}
                className={`cursor-pointer select-none rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  activeDemoId === business.id
                    ? "bg-slate-900 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {business.logo} {business.name.split(" ")[0]}
                {"'s Shop"}
              </button>
            ))}
          </div>

          {/* MAIN DEMO GRID */}
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 lg:grid-cols-5">
            {/* LEFT CONTENT */}
            <div className="space-y-6 lg:col-span-2">
              <div className="space-y-3">
                <span className="block w-fit rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                  Sector: {getSectorText()}
                </span>

                <h4 className="text-2xl font-black leading-tight text-slate-950">
                  {activeBiz.name}
                </h4>

                <p className="text-xs leading-relaxed text-slate-500">
                  {activeBiz.description}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    💳 Merchant UPI VPA:
                  </span>

                  <span className="rounded border bg-white px-2 py-0.5 font-mono font-bold text-slate-700">
                    {activeBiz.upiId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📍 Location:</span>

                  <span className="truncate font-semibold text-slate-700">
                    {activeBiz.address?.split("-")[0]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onSelectBusinessDemo(activeBiz)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border bg-slate-900 px-6 py-3.5 text-xs font-extrabold text-white shadow"
                >
                  <Eye className="h-4 w-4" />
                  Open Full Interactive Store
                </button>

                <button
                  type="button"
                  onClick={onCreateStore}
                  className="rounded-xl bg-emerald-600 px-6 py-3.5 text-center text-xs font-bold text-white shadow transition hover:bg-emerald-700"
                >
                  Create Mine Now
                </button>
              </div>
            </div>

            {/* MOBILE PREVIEW */}
            <div className="flex justify-center lg:col-span-3">
              <div className="relative flex aspect-[9/18] w-full max-w-[340px] flex-col overflow-hidden rounded-[48px] border-4 border-slate-800 bg-slate-950 p-3.5 shadow-2xl ring-1 ring-slate-900/10">
                {/* NOTCH */}
                <div className="absolute left-1/2 top-0 z-10 flex h-6 w-32 -translate-x-1/2 items-center justify-center rounded-b-2xl bg-slate-950">
                  <div className="h-1 w-12 rounded-full bg-slate-800" />
                </div>

                {/* SCREEN */}
                <div className="relative flex flex-1 flex-col overflow-hidden rounded-[34px] bg-white pt-8 font-sans">
                  {/* HEADER */}
                  <header className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">
                      {activeBiz.logo}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h5 className="truncate text-[10px] font-black leading-tight text-slate-800">
                        {activeBiz.name}
                      </h5>

                      <p className="truncate text-[8px] text-slate-400">
                        Catalogly digital storefront
                      </p>
                    </div>

                    <span className="shrink-0 rounded bg-emerald-50 p-1 text-[8px] font-bold uppercase text-emerald-700">
                      Active
                    </span>
                  </header>

                  {/* PRODUCTS */}
                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-3">
                    <p className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Available Products ({activeProducts.length})
                    </p>

                    {activeProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex gap-2 rounded-xl border bg-white p-2 text-left shadow-sm"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <h6 className="truncate text-[10px] font-extrabold leading-tight text-slate-900">
                            {product.name}
                          </h6>

                          <span className="text-[9px] uppercase tracking-wider text-slate-400">
                            {product.category}
                          </span>

                          <p className="mt-1 text-[10px] font-extrabold text-slate-950">
                            ₹{product.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="border-t bg-white p-2">
                    <button
                      type="button"
                      onClick={() => onSelectBusinessDemo(activeBiz)}
                      className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-slate-900 py-2 text-[10px] font-extrabold text-white shadow"
                    >
                      Browse Items & Add to Cart

                      <ShoppingBag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mb-10 space-y-2 text-center">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
            Frequently Asked Questions
          </span>

          <h2 className="text-3xl font-black tracking-tight text-slate-950">
            Got Questions? We have Answers!
          </h2>

          <p className="text-xs text-slate-500">
            Everything you need to know about setting up your Indian digital
            catalog.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-1.5 border-b pb-4">
            <h4 className="text-sm font-extrabold text-slate-900">
              Is Catalogly really free to use?
            </h4>

            <p className="text-xs leading-relaxed text-slate-500">
              Yes, our Free plan supports up to 15 fully editable products with
              a professional emerald store theme. We take absolutely 0%
              commission on orders. If your catalog grows, you can opt for the
              Premium plan at just ₹499/month.
            </p>
          </div>

          <div className="space-y-1.5 border-b py-4">
            <h4 className="text-sm font-extrabold text-slate-900">
              How do UPI payments work? Do I need Razorpay/Stripe details?
            </h4>

            <p className="text-xs leading-relaxed text-slate-500">
              No complex setup is required. By simply inputting your standard
              personal or merchant UPI ID (e.g., name@okaxis) during onboarding,
              we automatically generate scan-to-order QR codes containing your
              exact customer invoice total.
            </p>
          </div>

          <div className="space-y-1.5 border-b py-4">
            <h4 className="text-sm font-extrabold text-slate-900">
              How does the WhatsApp order system trigger?
            </h4>

            <p className="text-xs leading-relaxed text-slate-500">
              We compile the shopper&apos;s cart items, selected sizes/colors,
              contact details, and chosen invoice sums into a clean message
              structure. When the customer clicks &quot;Place Order&quot;, the
              app launches WhatsApp pre-filled with the draft.
            </p>
          </div>

          <div className="space-y-1.5 pt-4">
            <h4 className="text-sm font-extrabold text-slate-900">
              Can I print catalogs physically for my boutique store?
            </h4>

            <p className="text-xs leading-relaxed text-slate-500">
              Absolutely! Under the PDF Catalog Studio tab in your merchant
              panel, you can choose custom layouts, categories, and print
              high-resolution branded price outlines with native scan-links.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🛍️</span>

            <span className="font-extrabold text-slate-800">
              Catalogly India Inc. © 2026
            </span>
          </div>

          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secure SSL Encrypted
            </span>

            <span>Uncompromising minimalism</span>
          </div>
        </div>
      </footer>
    </div>
  );
}