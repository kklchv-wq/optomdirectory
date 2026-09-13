import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  gocNumber: text('goc_number').notNull(),
  subscribeUpdates: integer('subscribe_updates', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const specialities = sqliteTable('specialities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category', { enum: ['service', 'equipment'] })
    .notNull()
    .default('service'),
  groupName: text('group_name'),
  description: text('description'),
  status: text('status', { enum: ['approved', 'pending'] })
    .notNull()
    .default('approved'),
});

export const listings = sqliteTable('listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  slug: text('slug').notNull().unique(),
  practiceName: text('practice_name').notNull(),
  contactName: text('contact_name').notNull(),
  gocNumber: text('goc_number').notNull(),
  addressLine1: text('address_line_1').notNull(),
  addressLine2: text('address_line_2'),
  city: text('city').notNull(),
  postcode: text('postcode').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  website: text('website'),
  description: text('description'), // Verified <= 600 chars via Zod
  workingDays: text('working_days'), // JSON string array of active days e.g. ["Mon","Wed","Fri"]
  subscribeUpdates: integer('subscribe_updates', { mode: 'boolean' })
    .notNull()
    .default(true),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  editToken: text('edit_token').notNull().unique(),
  rejectionReason: text('rejection_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const listingSpecialities = sqliteTable(
  'listing_specialities',
  {
    listingId: integer('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    specialityId: integer('speciality_id')
      .notNull()
      .references(() => specialities.id, { onDelete: 'cascade' }),
    offeredBy: text('offered_by', { enum: ['personal', 'practice'] })
      .notNull()
      .default('practice'),
    referralType: text('referral_type', { enum: ['referral_required', 'self_referral'] })
      .notNull()
      .default('self_referral'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.listingId, table.specialityId] }),
  })
);

export const tagAlerts = sqliteTable('tag_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  postcode: text('postcode'),
  radiusMiles: integer('radius_miles').notNull().default(25),
  specialities: text('specialities'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const contactMessages = sqliteTable('contact_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('general'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  token: text('token').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Speciality = typeof specialities.$inferSelect;
export type NewSpeciality = typeof specialities.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingSpeciality = typeof listingSpecialities.$inferSelect;
export type TagAlert = typeof tagAlerts.$inferSelect;
export type NewTagAlert = typeof tagAlerts.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

