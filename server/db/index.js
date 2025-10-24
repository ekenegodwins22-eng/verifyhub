import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbFile = path.join(dataDir, 'verifyhub.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database with default structure
const defaultDb = {
  users: [],
  orders: [],
  transactions: [],
  services: []
};

// Load or create database
let database = defaultDb;

const loadDatabase = () => {
  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf-8');
      database = JSON.parse(data);
    } else {
      saveDatabase();
    }
  } catch (error) {
    console.error('Error loading database:', error);
    database = defaultDb;
  }
};

const saveDatabase = () => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Load database on startup
loadDatabase();

// Simple database wrapper
export const db = {
  // Users
  getUser: (telegramId) => {
    return database.users.find(u => u.telegramId === telegramId.toString());
  },

  createUser: (userData) => {
    const user = {
      id: database.users.length + 1,
      ...userData,
      telegramId: userData.telegramId.toString(),
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    };
    database.users.push(user);
    saveDatabase();
    return user;
  },

  updateUser: (userId, updates) => {
    const user = database.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates, { updatedAt: Math.floor(Date.now() / 1000) });
      saveDatabase();
    }
    return user;
  },

  // Orders
  createOrder: (orderData) => {
    const order = {
      id: database.orders.length + 1,
      ...orderData,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    };
    database.orders.push(order);
    saveDatabase();
    return order;
  },

  getOrder: (orderId, userId) => {
    return database.orders.find(o => o.id === orderId && o.userId === userId);
  },

  getUserOrders: (userId) => {
    return database.orders.filter(o => o.userId === userId);
  },

  updateOrder: (orderId, updates) => {
    const order = database.orders.find(o => o.id === orderId);
    if (order) {
      Object.assign(order, updates, { updatedAt: Math.floor(Date.now() / 1000) });
      saveDatabase();
    }
    return order;
  },

  getOrderBySmsPoolId: (smsPoolOrderId) => {
    return database.orders.find(o => o.smsPoolOrderId === smsPoolOrderId);
  },

  // Transactions
  createTransaction: (transactionData) => {
    const transaction = {
      id: database.transactions.length + 1,
      ...transactionData,
      createdAt: Math.floor(Date.now() / 1000)
    };
    database.transactions.push(transaction);
    saveDatabase();
    return transaction;
  },

  getUserTransactions: (userId) => {
    return database.transactions.filter(t => t.userId === userId);
  }
};

export default db;

