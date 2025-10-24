import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').unique().notNull(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  balance: real('balance').default(0),
  createdAt: integer('created_at').default(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').default(() => Math.floor(Date.now() / 1000)),
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  type: text('type').notNull(), // 'deposit', 'purchase', 'refund'
  amount: real('amount').notNull(),
  status: text('status').default('pending'), // 'pending', 'completed', 'failed'
  description: text('description'),
  paymentId: text('payment_id'), // For payment gateway reference
  createdAt: integer('created_at').default(() => Math.floor(Date.now() / 1000)),
});

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  service: text('service').notNull(), // 'telegram', 'google', 'whatsapp', etc.
  country: text('country').notNull(), // 'US', 'UK', 'FR', etc.
  phoneNumber: text('phone_number').notNull(),
  smsPoolOrderId: text('smspool_order_id').notNull(), // ID from SMSPool API
  apiPrice: real('api_price').notNull(), // What we paid to SMSPool
  userPrice: real('user_price').notNull(), // What user paid
  smsCode: text('sms_code'), // The received SMS code
  status: text('status').default('waiting_sms'), // 'waiting_sms', 'received', 'expired', 'cancelled'
  expiresAt: integer('expires_at'), // Timestamp when order expires
  createdAt: integer('created_at').default(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').default(() => Math.floor(Date.now() / 1000)),
});

// Services cache table (for dynamic pricing)
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: text('service_id').notNull(), // 'telegram', 'google', etc.
  serviceName: text('service_name').notNull(),
  country: text('country').notNull(),
  countryName: text('country_name'),
  apiPrice: real('api_price').notNull(), // SMSPool price
  userPrice: real('user_price').notNull(), // After markup
  available: integer('available').default(1), // 1 = true, 0 = false
  lastUpdated: integer('last_updated').default(() => Math.floor(Date.now() / 1000)),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  orders: many(orders),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

