/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { CatalogDb } from "./server-db";
import { Business, Product, Order } from "./src/types";

// Lazy-initialized Gemini Client
let googleGenAI: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!googleGenAI) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      googleGenAI = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini client successfully initialized.");
    }
  }
  return googleGenAI;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits higher to support custom product images (Base64)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // API Endpoints: Businesses
  app.get("/api/businesses", (req, res) => {
    try {
      const bizes = CatalogDb.getBusinesses();
      res.json(bizes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/business/by-slug/:slug", (req, res) => {
    try {
      const { slug } = req.params;
      const biz = CatalogDb.getBusinessBySlug(slug);
      if (!biz) {
        return res.status(404).json({ error: "Storefront not found" });
      }
      const products = CatalogDb.getProductsByBusiness(biz.id);
      res.json({ business: biz, products });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/business/:id", (req, res) => {
    try {
      const { id } = req.params;
      const biz = CatalogDb.getBusinessById(id);
      if (!biz) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(biz);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/business", (req, res) => {
    try {
      const payload = req.body as Business;
      if (!payload.name || !payload.slug) {
        return res.status(400).json({ error: "Business name and link slug are required" });
      }
      
      // Clean slug
      payload.slug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      
      // Prevent slug duplication (excluding itself)
      const existing = CatalogDb.getBusinessBySlug(payload.slug);
      if (existing && existing.id !== payload.id) {
        return res.status(400).json({ error: "Link link 'catalogly.app/store/" + payload.slug + "' is already taken. Try a different slug." });
      }

      const saved = CatalogDb.saveBusiness(payload);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/business/:id/view", (req, res) => {
    try {
      const { id } = req.params;
      CatalogDb.incrementBusinessViews(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Endpoints: Products
  app.get("/api/business/:id/products", (req, res) => {
    try {
      const { id } = req.params;
      const products = CatalogDb.getProductsByBusiness(id);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", (req, res) => {
    try {
      const payload = req.body as Product;
      if (!payload.name || !payload.businessId || payload.price === undefined) {
        return res.status(400).json({ error: "Product name, business identity, and price are required" });
      }
      const saved = CatalogDb.saveProduct(payload);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body as Product;
      payload.id = id;
      const saved = CatalogDb.saveProduct(payload);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = CatalogDb.deleteProduct(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products/reorder", (req, res) => {
    try {
      const { businessId, orderedIds } = req.body;
      if (!businessId || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "businessId and orderedIds array are required" });
      }
      CatalogDb.saveProductsReorder(businessId, orderedIds);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Endpoints: Orders
  app.get("/api/business/:id/orders", (req, res) => {
    try {
      const { id } = req.params;
      const orders = CatalogDb.getOrdersByBusiness(id);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/orders", (req, res) => {
    try {
      const order = req.body as Order;
      if (!order.businessId || !order.customerName || !order.customerPhone || !order.items || order.items.length === 0) {
        return res.status(400).json({ error: "Missing required order parameters (customer name, phone, cart items)" });
      }
      const saved = CatalogDb.saveOrder(order);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/orders/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;
      const updated = CatalogDb.updateOrderStatus(id, status, paymentStatus);
      if (!updated) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI-Powered COPYWRITER utilizing gemini-3.5-flash
  app.post("/api/ai/describe", async (req, res) => {
    try {
      const { productName, category, notes, tone } = req.body;
      if (!productName) {
        return res.status(400).json({ error: "Product name is required for description generation." });
      }

      const client = getGemini();
      if (!client) {
        // Safe fall-back response when key gets omitted
        return res.json({
          description: `Discover the luxury of our brand new ${productName}! Expertly curated under ${category || "General Store"}, handcrafted with high-grade components. Perfect for premium styling or daily use. Get yours today with customized sizing! ✨\n\n• Highly Durable Materials\n• Traditional Indian Craftsmanship\n• Comfortable & Long-lasting`,
          tagline: `Elevate your lifestyle with the supreme touch of ${productName}.`,
          suggestedTags: [productName.split(" ")[0].toLowerCase(), "premium", "indian-made", "handcrafted"],
          isDemo: true,
          warn: "To activate high-fidelity AI-generated descriptions, configure your GEMINI_API_KEY in Settings > Secrets."
        });
      }

      const systemPrompt = "You are an elite, warm, and highly persuasive copywriting optimizer for local Indian online merchants (such as boutiques, craftshops, cloud kitchens, and organic stores). Make products sound absolutely authentic, luxury, and premium.";
      const userPrompt = `Generate a rich, high-converting, magnetic product catalog description for an Indian store item.
Product Name: ${productName}
Category: ${category || "General"}
Custom seller remarks/features: ${notes || "Zero custom notes"}
Vibe/Tone Selection: ${tone || "Professional, local and appetizing"}

Provide structural outputs in detailed JSON format containing "description" (around 100 words including beautiful emoji bullets), a snappy promotional "tagline", and an array of 3 "suggestedTags" for search. Be localized with phrases invoking premium quality and Indian warmth (like "Handcrafted with supreme love", "Perfect for weddings & festive gifting").`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "compelling beautiful markdown description with 2-3 friendly emojis and highlight bullets",
              },
              tagline: {
                type: Type.STRING,
                description: "A short, snappy click-worthy hook tagline",
              },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 highly search-optimized keyword tags",
              },
            },
            required: ["description", "tagline", "suggestedTags"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No text returned from Gemini API");
      }

      const resultObj = JSON.parse(responseText.trim());
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini copywriting error:", err);
      // Fail-safe
      res.json({
        description: `Get the perfect selection of ${req.body.productName || "our latest item"}. High quality finish, premium comfort, and built to make your daily routine luxurious. Order now to get direct home delivery!`,
        tagline: "Uncompromised authenticity, crafted just for you.",
        suggestedTags: ["local", "premium", "delight"],
        error: err.message
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application active and routing on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap failure:", err);
});
