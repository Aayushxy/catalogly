/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { Business, Product, Order } from "./src/types";
import { DEFAULT_BUSINESSES, DEFAULT_PRODUCTS, DEFAULT_ORDERS } from "./src/data/seedData";

const DB_FILE = path.join(process.cwd(), "database.json");

interface DatabaseSchema {
  businesses: Business[];
  products: Product[];
  orders: Order[];
}

// Ensure database file exists and is seeded
function initDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data) as DatabaseSchema;
    }
  } catch (error) {
    console.error("Error reading database file, resetting...", error);
  }

  // Create initial seeded state
  const initialSchema: DatabaseSchema = {
    businesses: DEFAULT_BUSINESSES,
    products: DEFAULT_PRODUCTS,
    orders: DEFAULT_ORDERS,
  };
  saveDb(initialSchema);
  return initialSchema;
}

function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database.json", error);
  }
}

// In-Memory context cache loaded from file
let dbState = initDb();

export const CatalogDb = {
  // Businesses
  getBusinesses: (): Business[] => {
    return dbState.businesses;
  },

  getBusinessBySlug: (slug: string): Business | undefined => {
    return dbState.businesses.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
  },

  getBusinessById: (id: string): Business | undefined => {
    return dbState.businesses.find((b) => b.id === id);
  },

  saveBusiness: (business: Business): Business => {
    const index = dbState.businesses.findIndex((b) => b.id === business.id);
    if (index >= 0) {
      dbState.businesses[index] = { ...business };
    } else {
      dbState.businesses.push(business);
    }
    saveDb(dbState);
    return business;
  },

  incrementBusinessViews: (id: string) => {
    const index = dbState.businesses.findIndex((b) => b.id === id);
    if (index >= 0) {
      dbState.businesses[index].views += 1;
      saveDb(dbState);
    }
  },

  // Products
  getProductsByBusiness: (businessId: string): Product[] => {
    return dbState.products
      .filter((p) => p.businessId === businessId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getProductById: (id: string): Product | undefined => {
    return dbState.products.find((p) => p.id === id);
  },

  saveProduct: (product: Product): Product => {
    const index = dbState.products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      dbState.products[index] = { ...product };
    } else {
      dbState.products.push(product);
    }
    saveDb(dbState);
    return product;
  },

  deleteProduct: (id: string): boolean => {
    const initialLen = dbState.products.length;
    dbState.products = dbState.products.filter((p) => p.id !== id);
    const success = dbState.products.length < initialLen;
    if (success) {
      saveDb(dbState);
    }
    return success;
  },

  saveProductsReorder: (businessId: string, orderedIds: string[]) => {
    dbState.products = dbState.products.map((p) => {
      if (p.businessId === businessId) {
        const index = orderedIds.indexOf(p.id);
        if (index >= 0) {
          return { ...p, sortOrder: index };
        }
      }
      return p;
    });
    saveDb(dbState);
  },

  // Orders
  getOrdersByBusiness: (businessId: string): Order[] => {
    return dbState.orders
      .filter((o) => o.businessId === businessId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  saveOrder: (order: Order): Order => {
    const index = dbState.orders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
      dbState.orders[index] = { ...order };
    } else {
      dbState.orders.push(order);
      // Increment ordersCount on business
      const bizIndex = dbState.businesses.findIndex((b) => b.id === order.businessId);
      if (bizIndex >= 0) {
        dbState.businesses[bizIndex].ordersCount += 1;
      }
    }
    saveDb(dbState);
    return order;
  },

  updateOrderStatus: (id: string, status: "NEW" | "COMPLETED" | "CANCELLED", paymentStatus: "PENDING" | "PAID"): Order | undefined => {
    const index = dbState.orders.findIndex((o) => o.id === id);
    if (index >= 0) {
      dbState.orders[index].status = status;
      dbState.orders[index].paymentStatus = paymentStatus;
      saveDb(dbState);
      return dbState.orders[index];
    }
    return undefined;
  },
};
