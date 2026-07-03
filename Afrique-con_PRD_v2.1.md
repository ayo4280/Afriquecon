# PRODUCT REQUIREMENTS DOCUMENT (PRD) v2.1
## Afrique-con Plc: Integrated Transport & Logistics Platform

**Document Version:** 2.1 (Telegram Integration)  
**Date:** June 2026  
**Project Name:** Afrique-con Platform MVP  
**Status:** Ready for Development  
**Deployment:** Netlify + Antigravity + Supabase + Telegram

---

## TABLE OF CONTENTS

1. Executive Summary
2. Product Vision & Objectives
3. Target Audiences & User Personas
4. Platform Overview
5. Technical Architecture
6. Core Features & Specifications
7. Database Schema
8. API Specifications
9. Antigravity Workflows
10. Frontend Structure
11. Admin Dashboard
12. Content & Brand Guidelines
13. Website Sitemap & Navigation
14. Deployment & DevOps
15. Timeline & Milestones
16. Budget & Costs
17. Risk Mitigation
18. Future Enhancements
19. Success Metrics & KPIs
20. Glossary

---

## 1. EXECUTIVE SUMMARY

Afrique-con Plc is building an integrated digital platform for cross-border transport operations between Cameroon and Nigeria. The platform enables **dual revenue streams**: commercial cargo shipping (FTL, LTL, heavy equipment) and passenger ticketing (luxury bus service).

**Key Differentiators:**
- Single unified booking system for both cargo and passenger services
- Instant automated quoting for cargo & trips
- Real-time cargo tracking + passenger journey notifications via Telegram
- Shared fleet infrastructure (buses transport both cargo and passengers)
- Free/low-cost tech stack with **Telegram as primary messaging** (no SMS costs)

**Target Launch:** 8 weeks from kickoff  
**Monthly Operating Cost:** $15-65 (free tier + transaction fees, **NO SMS costs**)  
**MVP Scope:** Full cargo + passenger platforms with admin dashboard  
**Messaging:** Telegram Bot API (free, rich formatting, instant delivery)

---

## 2. PRODUCT VISION & OBJECTIVES

### 2.1 Vision Statement
"Digitalize cross-border African transport by connecting shippers and travelers to reliable, traceable, and affordable logistics solutions in real-time via instant messaging."

### 2.2 Strategic Objectives

| Objective | Success Metric | Timeline |
|-----------|---|----------|
| Reduce manual quote processing | 85% automation rate | 6 months |
| Enable 24/7 self-service booking | 70% bookings online | 3 months |
| Build customer trust | 4.5+ star rating | Ongoing |
| Monetize dual services | ₦50M revenue/month by month 12 | 12 months |
| Expand operations | Add 3 new routes | 6 months |
| Zero SMS infrastructure costs | 100% Telegram-based messaging | Go-live |

### 2.3 Key Success Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Website Load Time | <2s | Netlify Analytics |
| Cargo Quote Conversion | 12% | Supabase events |
| Passenger Ticket Sales | 50+ tickets/week | Admin dashboard |
| Platform Uptime | 99.5% | Sentry monitoring |
| Customer Support Response | <2 hours | Telegram bot logs |
| Mobile Traffic | 65% | Plausible Analytics |
| Booking-to-Payment Time | <5 minutes | API logs |
| Telegram Notification Delivery | 99% | Telegram Bot API metrics |

---

## 3. TARGET AUDIENCES & USER PERSONAS

### 3.1 Cargo Customers

**Persona A: Small Business Shipper**
- Age: 25-45 | Location: Lagos, Abuja, Douala, Yaoundé
- Profile: Traders, small importers, e-commerce businesses
- Tech Comfort: Medium (mobile-first, messaging app-savvy)
- Monthly Shipments: 2-5
- Goals: Quick quotes, reliable delivery, affordable pricing
- Pain Points: Manual quotes take hours, unclear pricing, no tracking
- Preferred Communication: Telegram (instant updates, files)

**Persona B: Corporate Account Manager**
- Age: 30-55 | Location: City-based offices
- Profile: Large logistics firms, importers, exporters, manufacturers
- Tech Comfort: High (Excel-fluent, API-aware)
- Monthly Shipments: 20+
- Goals: Volume discounts, API integrations, reporting, invoicing
- Pain Points: Complex contracts, custom pricing needs, batch scheduling
- Preferred Communication: Email + Telegram for urgent updates

**Persona C: Individual Shipper**
- Age: 18-50 | Location: Cross-border traders, diaspora
- Profile: Personal item senders, small traders
- Tech Comfort: Medium
- Monthly Shipments: 1-2
- Goals: Safe delivery, affordable and transparent pricing
- Pain Points: Uncertain cargo safety, pricing variance, no tracking
- Preferred Communication: Telegram for quick updates

### 3.2 Passenger Customers

**Persona D: Individual Traveler (Business & Leisure)**
- Age: 18-70 | Location: Both countries
- Profile: Professionals, students, family visitors, tourists
- Tech Comfort: Medium-High (smartphone-dependent)
- Trip Frequency: Monthly to quarterly
- Goals: Comfortable journey, guaranteed seat, clear schedules, safety
- Pain Points: Uncertain booking confirmations, no seat preferences, delay anxiety
- Preferred Communication: Telegram for booking confirmations and travel updates

### 3.3 User Journey Maps

**Cargo Shipping Flow:**
```
Discovery → Quote (instant) → Book → Pay → Confirm (Telegram) 
→ Track (Telegram updates) → Deliver → Repeat
```

**Passenger Booking Flow:**
```
Discovery → Browse Trips → Select Seat → Book → Pay 
→ E-Ticket (Telegram) → Travel (Telegram updates) → Feedback
```

---

## 4. PLATFORM OVERVIEW

### 4.1 Core Services

#### **Service 1: Cargo Shipping**
- **Full Truck Load (FTL):** Entire truck capacity reserved
- **Less Than Truck Load (LTL):** Shared truck space
- **Heavy Equipment:** Specialised vehicles with extra handling
- **Customs Clearance:** Complete border documentation handling
- **Warehousing:** Storage at branch locations

**Routes Covered:**
- Cameroon: Yaoundé, Douala, Buea, Kumba
- Nigeria: Lagos, Abuja, Onitsha, Enugu, Abakaliki, Ikom

#### **Service 2: Passenger Ticketing**
- **Luxury Coach Travel:** 48-seat air-conditioned buses
- **Scheduled Routes:** Interconnected daily departures
- **Bus Features:** WiFi, reclining seats, on-board facilities
- **Seat Selection:** Visual map with preference options
- **Group Bookings:** Corporate packages available

#### **Items NOT Accepted**
- Containerized cargo
- Refrigerated goods
- Hazardous materials
- Restricted items: Garri, rice, non-NAFDAC certified products, expired items

### 4.2 Pricing Model

#### **Cargo Pricing — Key Rules**

```
CRITICAL RULES:
• Base Currency: FCFA — ALL calculations done in FCFA first
• NGN Conversion: Fixed rate: NGN = FCFA × 2.5 (e.g. 40,000 FCFA = 100,000 NGN)
• Reservation Rule: Bookings MUST be confirmed 48 hours before departure
• Express Surcharge: +25,000 FCFA if booking is made within 48 hours of departure

Surcharges (Applied on top of Base Rate):
• Overweight (>20kg): +5,000 FCFA per 10kg
• Heavy Equipment: +15% of base rate
• Cameroon Shipper: +5% domestic markup

Discounts (Deducted from subtotal):
• Volume (10+ shipments/month): -10%
• Loyalty (5+ completed shipments): -5%
```

#### **Cargo Pricing — Sample Routes (FCFA ↔ NGN)**

| Origin | Destination | Base Rate (FCFA) | Equivalent (NGN) |
|--------|---|---|---|
| Yaoundé | Lagos | 95,000 | 237,500 |
| Yaoundé | Abuja | 100,000 | 250,000 |
| Douala | Lagos | 90,000 | 225,000 |
| Douala | Abuja | 90,000 | 225,000 |
| Buea | Lagos | 90,000 | 225,000 |
| Kumba | Lagos | 85,000 | 212,500 |
| Kumba | Abuja | 85,000 | 212,500 |
| Ikom | Lagos | 40,000 | 100,000 |

#### **Passenger Pricing — Rules**

```
Base Currency: FCFA (same as cargo)
NGN Conversion: FCFA × 2.5 fixed multiplier
Reservation Rule: 48 hours before departure required

Passenger Discounts:
• Adult: No discount
• Student (with ID): -10%
• Senior (60+): -15%
• Child (under 12): -20%

Extra Fees:
• Luggage >2 items: +2,000 NGN per item
• Early bird booking (>7 days): -10%
• Group booking (5+ passengers): -5%
```

#### **Sample Passenger Routes (FCFA ↔ NGN)**

| Origin | Destination | Base Fare (FCFA) | Equiv. (NGN) | Duration |
|--------|---|---|---|---|
| Douala | Lagos | 48,000 | 120,000 | 8.5 hrs |
| Douala | Abuja | 56,000 | 140,000 | 10 hrs |
| Yaoundé | Lagos | 60,000 | 150,000 | 10 hrs |
| Yaoundé | Abuja | 64,000 | 160,000 | 12 hrs |
| Lagos | Douala | 48,000 | 120,000 | 8.5 hrs |

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Tech Stack Overview

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| **Frontend** | React 18 + TypeScript | Type-safe, performant, component reuse |
| **Styling** | Tailwind CSS | Utility-first, lightweight, responsive |
| **Hosting** | Netlify | Free tier, edge functions, auto-scaling |
| **Backend Logic** | Antigravity | No-code automation, workflow orchestration |
| **Database** | Supabase (PostgreSQL) | Free tier (500MB), real-time, RLS support |
| **Auth** | Supabase Auth | Passwordless email / OAuth, built-in |
| **Storage** | Supabase Storage | 1 GB free, e-tickets, documents |
| **Maps** | Leaflet.js + OpenStreetMap | Free, unlimited, no API key limits |
| **Messaging** | Telegram Bot API | FREE, instant, rich formatting, 100+ languages |
| **Email** | Resend | 100 emails/day free tier |
| **Payments (NG)** | Paystack | Native gateway, NGN, 1.5% + ₦10 |
| **Payments (CM)** | Flutterwave | Native gateway, FCFA, 1.4% + 50 FCFA |
| **Analytics** | Plausible Analytics | Privacy-first, GDPR compliant, free tier |
| **Error Tracking** | Sentry | 5K events/month free tier |

### 5.2 Platform Architecture

```
┌──────────────────────────────────────────────────┐
│          CLIENT LAYER (React SPA)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Cargo  │ │ Tickets │ │  Admin  │          │
│  │ Booking │ │Booking  │ │Dashboard│          │
│  └─────────┘ └─────────┘ └─────────┘          │
│      ↓            ↓            ↓               │
│  Hosted on Netlify Global CDN (<1.5s load)    │
└──────────────────────────────────────────────────┘
              ↓          ↓          ↓
┌──────────────────────────────────────────────────┐
│      NETLIFY EDGE FUNCTIONS (Serverless)        │
│  • Rate limiting • Request routing             │
│  • JWT validation • CORS handling              │
└──────────────────────────────────────────────────┘
              ↓          ↓          ↓
┌──────────────────────────────────────────────────┐
│         ANTIGRAVITY AUTOMATION LAYER             │
│  ┌───────────┐ ┌──────────┐ ┌───────────────┐ │
│  │ Cargo     │ │ Passenger│ │ Telegram      │ │
│  │ Quote Gen │ │ Booking  │ │ Notifications │ │
│  │ (Instant) │ │ (Multi)  │ │ (Instant)     │ │
│  └───────────┘ └──────────┘ └───────────────┘ │
└──────────────────────────────────────────────────┘
              ↓          ↓          ↓
┌──────────────────────────────────────────────────┐
│    SUPABASE DATA & TELEGRAM INTEGRATION          │
│  ┌──────────┐ ┌────────┐ ┌──────────────────┐ │
│  │PostgreSQL│ │ Auth   │ │Telegram Bot API  │ │
│  │Database  │ │(Email) │ │(Messaging)       │ │
│  │RLS/Sec   │ │OAuth   │ │(Free tier)       │ │
│  └──────────┘ └────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────┘
              ↓          ↓          ↓
┌──────────────────────────────────────────────────┐
│      EXTERNAL INTEGRATIONS & APIs                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ Paystack │ │Flutterw. │ │ Leaflet Maps     ││
│  │(Nigeria) │ │(Cameroon)│ │ OpenStreetMap    ││
│  └──────────┘ └──────────┘ └──────────────────┘│
└──────────────────────────────────────────────────┘
```

### 5.3 Telegram Integration Points

**Telegram Bot Setup:**
- Bot Token: Stored securely in Netlify environment variables
- Webhook: `/api/webhooks/telegram` receives messages
- Bot Commands:
  - `/quote` - Request cargo quote
  - `/track` - Check shipment status
  - `/ticket` - Check ticket details
  - `/support` - Contact customer support

**Notification Flow:**
- Antigravity triggers Telegram API
- Bot sends formatted message to customer
- Customer receives notification instantly
- Telegram handles message queuing + retry logic

---

## 6. CORE FEATURES & SPECIFICATIONS

### 6.1 Homepage — Dual Service Switcher

**Key Elements:**
1. **Service Toggle:** Tabs for "Ship Cargo" vs "Book Travel"
2. **Dynamic hero illustration** changes per selected service
3. **Primary CTAs:**
   - Cargo: "Get Instant Quote"
   - Passenger: "Find Your Trip"
4. **Trust indicators:** Ratings, statistics, certifications
5. **Interactive route map:** Leaflet with all coverage areas
6. **Mixed testimonials** from shippers and travelers
7. **Telegram integration hint:** "Instant updates via Telegram"

**Technical Specifications:**
- Load time: <1.5s
- Map tiles lazy-loaded
- Service state managed in React Context
- Mobile-optimized with responsive forms
- Testimonials from Supabase CMS
- Telegram bot link in footer

### 6.2 Cargo Quote System

**Real-time Quote Generation with Business Rules:**

```
Input: origin, destination, weight_kg, cargoType, customerNationality

Processing:
1. Validate route exists in routes table
2. Fetch base_rate_fcfa from database
3. Check if booking within 48 hours → add express surcharge
4. Calculate all surcharges (in FCFA):
   - IF weight > 20kg: +5,000 FCFA per 10kg
   - IF heavy_equipment: +15% of base
   - IF cameroon_shipper: +5% of base
5. Apply discounts (if applicable):
   - IF volume >= 10: -10%
   - IF loyalty >= 5: -5%
6. Calculate FCFA total
7. Convert to NGN: × 2.5 (fixed multiplier)
8. Return quote with 24-hour validity

Output: JSON response with FCFA + NGN + 48hr warning
```

**Quote Response Example:**
```json
{
  "quoteId": "QUOTE-20240629-001",
  "baseFCFA": 90000,
  "surcharges": 5000,
  "totalFCFA": 95000,
  "totalNGN": 237500,
  "isExpress": false,
  "estimatedHours": 28,
  "reservationRequired": "48 hours before departure",
  "expiresAt": "2024-06-30T14:26:00Z",
  "validityHours": 24,
  "notificationMethod": "Telegram"
}
```

### 6.3 Passenger Ticket Booking

**User Flow:**
1. Search trips: origin, destination, date, # passengers
2. View available buses with departure times
3. Select seat from visual 48-seat map (2+2 layout, 12 rows)
4. Enter passenger information (name, email, phone, ID)
5. Choose ticket type (Adult / Student / Senior / Child)
6. Review pricing and apply promo codes
7. Choose payment method (Paystack or Flutterwave)
8. Complete payment → receive e-ticket PDF + **Telegram confirmation**

**Seat Map Interface:**
- Color-coded: Green (available), Blue (selected), Grey (occupied)
- Price displayed per seat
- Seat preferences available: aisle, window, front, back
- Real-time availability updates

**E-Ticket Contents:**
- Unique Ticket ID: AFCON-TKT-YYYYMMDD-XXXXX
- QR code for boarding check-in
- Passenger details and seat number
- Bus number, departure gate and time
- Luggage allowance info
- **Telegram link for updates**

### 6.4 Real-Time Cargo Tracking

**Tracking ID Format:** AFCON-YYYYMMDD-XXXXX

**Status Timeline with Telegram Updates:**

| Stage | Status Label | Notification Sent |
|-------|---|---|
| 1 | Booked | Telegram + Email with tracking link |
| 2 | Pickup Scheduled | Telegram 48 hrs before pickup |
| 3 | In Transit | Telegram with ETA |
| 4 | Customs Clearance | Telegram: expected 1-2 hr delay |
| 5 | Arrived | Telegram: at destination city |
| 6 | Delivered | Telegram + Email confirmation |

**Delay Notifications:**
- Customer receives Telegram message with delay reason
- Revised ETA provided
- Apology & assurance message included
- Contact support button in Telegram bot

### 6.5 Passenger Journey & Travel Updates

**Telegram Notifications Schedule:**

| Trigger | Channel | Content |
|---------|---------|---------|
| Booking confirmed | Telegram + Email | E-ticket PDF, seat number, departure time |
| 24 hours before | Telegram | Reminder, gate assignment, arrival time |
| 2 hours before | Telegram | Final boarding call, gate location |
| Trip delayed | Telegram | Reason for delay, revised ETA |
| After arrival | Telegram | Feedback request, discount code for next booking |

**Passenger Tracking Interface:**
- Status: "On schedule" / "Running [X] minutes late"
- Current location: Bus route progress on map
- Estimated arrival time (countdown timer)
- Contact operator link for urgent issues
- All updates via Telegram bot

### 6.6 Payment Integration

| Gateway | Market | Currency | Fee | Trigger |
|---------|--------|----------|-----|---------|
| Paystack | Nigeria | NGN | 1.5% + ₦10 | Webhook: charge.success |
| Flutterwave | Cameroon | FCFA | 1.4% + 50 FCFA | Webhook: charge.completed |
| Cash | Both | Both | None | Manual admin confirmation + Telegram notification |

**Payment Flow:**
1. Customer selects payment method
2. Redirected to secure payment page (Paystack/Flutterwave)
3. Payment processing (test mode: instant)
4. Webhook received by Antigravity
5. Booking created in Supabase
6. **Telegram confirmation sent to customer** (via Antigravity workflow)
7. Customer receives e-ticket or shipment tracking link
8. Payment before service is mandatory

### 6.7 Admin Dashboard

**Access:** Staff only (email/password via Supabase Auth + optional 2FA)

**Dashboard Sections:**

| Section | Key Features |
|---------|---|
| **Overview** | KPIs (shipments, tickets, revenue), weekly chart, delayed alerts |
| **Cargo Mgmt** | Shipment list, status update interface, Telegram notification triggers |
| **Passenger Mgmt** | Ticket list, bus manifest, QR code check-in scanner |
| **Fleet Mgmt** | Bus inventory, seat availability, maintenance schedule |
| **Reports** | Revenue by service, route analytics, on-time %, export CSV/PDF |
| **Settings** | Routes & pricing, bus schedules, staff accounts, branch info |

**User Roles:**
- **Admin:** Full access to all features and settings
- **Cargo Operator:** Update cargo statuses only
- **Passenger Operator:** Bus schedules, check-ins, seat management
- **Support Staff:** Read-only, can respond to customer inquiries via Telegram
- **Finance Manager:** Revenue reports and payment logs only

### 6.8 Telegram Support Channel

**Support Features:**
- **Telegram Bot Commands:**
  - `/start` - Welcome message with menu
  - `/quote` - Request cargo quote
  - `/track` - Check shipment or ticket status
  - `/help` - FAQ and support options
  - `/contact` - Contact support team
- **24/7 Availability:** Bot responds instantly
- **Live Agent:** Escalation to human support staff via Telegram
- **Language Support:** English and French via bot settings

### 6.9 FAQs (Searchable & in-app)

**Cargo FAQs:**
- How do I request a quote?
- How do I track my shipment via Telegram?
- What happens if my delivery is late?
- Do you offer volume discounts?
- What is your insurance policy?
- How do I file a claim?

**Passenger FAQs:**
- How do I book a bus ticket?
- How do I receive my e-ticket?
- What is the luggage allowance?
- Can I cancel or reschedule my ticket?
- Will I get Telegram reminders before departure?
- What if the bus is delayed?

---

## 7. DATABASE SCHEMA

### 7.1 Core Tables

```sql
-- AUTHENTICATION & USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  telegram_id TEXT, -- Telegram user ID for notifications
  full_name TEXT,
  country TEXT, -- 'NG' or 'CM'
  auth_provider TEXT, -- 'email', 'google'
  user_type TEXT, -- 'shipper', 'passenger', 'admin'
  notification_channel TEXT DEFAULT 'telegram', -- 'telegram', 'email', 'both'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CARGO BOOKINGS
CREATE TABLE cargo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL, -- AFCON-YYYYMMDD-XXXXX
  user_id UUID REFERENCES users(id),
  quote_id TEXT,
  
  -- Route & Cargo
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight_kg DECIMAL(8,2) NOT NULL,
  cargo_type TEXT, -- 'general', 'heavy_equipment'
  
  -- Pricing (ALWAYS in FCFA)
  base_rate_fcfa DECIMAL(10,2) NOT NULL,
  surcharges_fcfa DECIMAL(10,2) DEFAULT 0,
  total_fcfa DECIMAL(10,2) NOT NULL,
  currency_used TEXT DEFAULT 'FCFA',
  
  -- Customer & Recipient
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_telegram_id TEXT, -- For Telegram notifications
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  
  -- Dates & Status
  booking_date TIMESTAMP DEFAULT NOW(),
  scheduled_pickup TIMESTAMP,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  status TEXT DEFAULT 'pending',
  payment_status TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CARGO STATUS HISTORY
CREATE TABLE cargo_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES cargo_bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  telegram_sent BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

-- ROUTES (Master Data)
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  origin_code TEXT,
  destination TEXT NOT NULL,
  destination_code TEXT,
  base_rate_fcfa DECIMAL(10,2) NOT NULL,
  estimated_hours INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- BUS FLEET
CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT UNIQUE NOT NULL, -- AFCON-01
  registration_plate TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 48,
  condition TEXT DEFAULT 'operational',
  features TEXT[] DEFAULT '{"wifi", "ac", "reclining_seats"}',
  last_maintenance TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- BUS SCHEDULES
CREATE TABLE bus_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  base_fare_fcfa DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'scheduled',
  available_seats INTEGER DEFAULT 48,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PASSENGER TICKETS
CREATE TABLE passenger_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL, -- AFCON-TKT-YYYYMMDD-XXXXX
  schedule_id UUID REFERENCES bus_schedules(id),
  user_id UUID REFERENCES users(id),
  
  -- Passenger Info
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_telegram_id TEXT, -- For Telegram reminders
  id_type TEXT, -- 'passport', 'national_id'
  id_number TEXT,
  
  -- Ticket Details (ALL in FCFA)
  seat_number TEXT NOT NULL,
  ticket_type TEXT, -- 'adult', 'student', 'senior', 'child'
  base_fare_fcfa DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  final_price_fcfa DECIMAL(10,2) NOT NULL,
  
  -- Status
  booking_date TIMESTAMP DEFAULT NOW(),
  payment_status TEXT,
  ticket_status TEXT DEFAULT 'confirmed',
  check_in_time TIMESTAMP,
  
  -- Notifications
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEAT INVENTORY
CREATE TABLE seat_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES bus_schedules(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  ticket_id UUID REFERENCES passenger_tickets(id),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- TELEGRAM MESSAGE LOG
CREATE TABLE telegram_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  telegram_id TEXT NOT NULL,
  message_type TEXT, -- 'booking_confirmation', 'status_update', 'reminder', etc.
  reference_id TEXT, -- booking_id or ticket_id
  message_text TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_confirmed BOOLEAN DEFAULT FALSE,
  response_received BOOLEAN DEFAULT FALSE
);

-- STAFF ACCOUNTS
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Currency Convention

**All monetary values stored in FCFA only:**
- Ensures single source of truth
- Eliminates drift from dynamic exchange rates
- NGN calculated at application layer: `ngn_value = fcfa_value × 2.5`
- Telegram notifications display both FCFA and NGN

---

## 8. API SPECIFICATIONS

### 8.1 Cargo APIs

**POST /api/cargo/quote**
```json
REQUEST:
{
  "origin": "Douala",
  "destination": "Lagos",
  "weight_kg": 2500,
  "cargoType": "general",
  "customerNationality": "Nigerian"
}

RESPONSE (200):
{
  "quoteId": "QUOTE-20240629-001",
  "baseFCFA": 90000,
  "totalFCFA": 95000,
  "totalNGN": 237500,
  "isExpress": false,
  "reservationRequired": "48 hours before departure",
  "expiresAt": "2024-06-30T14:26:00Z",
  "notificationChannel": "telegram"
}
```

**POST /api/cargo/booking**
```json
REQUEST:
{
  "quoteId": "QUOTE-20240629-001",
  "customerName": "John Doe",
  "customerPhone": "+2349029072330",
  "customerTelegramId": "123456789",
  "recipientName": "Jane Doe",
  "recipientPhone": "+2349029072331",
  "deliveryAddress": "123 Lagos St, Lekki",
  "paymentMethod": "paystack"
}

RESPONSE (201):
{
  "bookingId": "AFCON-20240629-001",
  "status": "confirmed",
  "totalFCFA": 90000,
  "totalNGN": 225000,
  "trackingUrl": "https://afrique-con.com/track/AFCON-20240629-001",
  "telegramNotificationSent": true,
  "notificationMessage": "Confirmed. Check Telegram for updates."
}
```

**GET /api/cargo/track/{bookingId}**
```json
RESPONSE (200):
{
  "bookingId": "AFCON-20240629-001",
  "status": "in_transit",
  "currentLocation": "Limbe Border",
  "estimatedDelivery": "2024-07-01T15:30:00Z",
  "lastUpdate": "2024-06-30T10:45:00Z",
  "telegramChannel": "@afrique_con_bot",
  "timeline": [
    {
      "status": "booked",
      "timestamp": "2024-06-29T14:26:00Z",
      "location": "Douala Branch"
    },
    {
      "status": "in_transit",
      "timestamp": "2024-06-29T20:15:00Z"
    }
  ]
}
```

### 8.2 Passenger APIs

**GET /api/passenger/trips**
```
Query: ?origin=Douala&destination=Lagos&date=2024-06-29&passengers=1

RESPONSE (200):
{
  "trips": [
    {
      "scheduleId": "SCHED-001",
      "busNumber": "AFCON-01",
      "departure": "2024-06-29T07:00:00Z",
      "arrival": "2024-06-29T15:30:00Z",
      "baseFare": 48000,
      "baseFareNGN": 120000,
      "availableSeats": 15
    }
  ]
}
```

**GET /api/passenger/seats/{scheduleId}**
```json
RESPONSE (200):
{
  "scheduleId": "SCHED-001",
  "seats": [
    {
      "seatNumber": "01A",
      "status": "available",
      "price": 48000
    },
    {
      "seatNumber": "01B",
      "status": "booked"
    }
  ]
}
```

**POST /api/passenger/ticket**
```json
REQUEST:
{
  "scheduleId": "SCHED-001",
  "seatNumber": "12B",
  "passengerName": "John Doe",
  "passengerPhone": "+2349029072330",
  "passengerTelegramId": "123456789",
  "ticketType": "adult",
  "paymentMethod": "paystack"
}

RESPONSE (201):
{
  "ticketId": "AFCON-TKT-20240629-001",
  "seatNumber": "12B",
  "finalPriceFCFA": 48000,
  "finalPriceNGN": 120000,
  "qrCode": "iVBORw0KGgoAAAANS...",
  "telegramConfirmationSent": true
}
```

### 8.3 Payment Webhooks

**POST /api/webhooks/paystack**
```json
RECEIVES:
{
  "event": "charge.success",
  "data": {
    "reference": "AFCON-QUOTE-001",
    "amount": 225000,
    "status": "success",
    "customer": { "email": "john@example.com" }
  }
}

TRIGGERS: Antigravity booking confirmation → Telegram notification
```

**POST /api/webhooks/flutterwave**
```json
RECEIVES:
{
  "event": "charge.completed",
  "data": {
    "tx_ref": "AFCON-TKT-001",
    "amount": 95000,
    "status": "successful"
  }
}

TRIGGERS: Antigravity booking confirmation → Telegram notification
```

### 8.4 Telegram Webhook

**POST /api/webhooks/telegram**
```json
RECEIVES:
{
  "update_id": 12345,
  "message": {
    "message_id": 1,
    "from": { "id": 123456789, "first_name": "John" },
    "text": "/track AFCON-20240629-001"
  }
}

PROCESSES:
1. Parse command and parameters
2. Look up booking/ticket in Supabase
3. Format response message
4. Send message via Telegram Bot API
```

---

## 9. ANTIGRAVITY WORKFLOWS

### 9.1 Workflow 1: Cargo Quote Generation

**Trigger:** Customer submits quote form  
**Duration:** <500ms

**Steps:**
1. Validate route exists
2. Fetch base_rate_fcfa
3. Check if within 48hrs → add express surcharge (+25,000 FCFA)
4. Calculate all surcharges (FCFA):
   - Weight: +5,000 per 10kg if > 20kg
   - Equipment: +15% if heavy
   - Markup: +5% if Cameroon shipper
5. Apply discounts (volume, loyalty)
6. Calculate FCFA total
7. Convert to NGN: × 2.5
8. Store quote in database
9. **Return JSON with 24-hour validity**

**Error Handling:**
- Route not found → 404
- Invalid weight → 400
- Booking <48hrs → quote with `isExpress: true`

### 9.2 Workflow 2: Cargo Booking Confirmation

**Trigger:** Payment webhook (Paystack/Flutterwave success)  
**Duration:** 2-3 seconds

**Steps:**
1. Verify webhook signature
2. Fetch booking details
3. Create booking record in Supabase
4. Generate booking ID: AFCON-YYYYMMDD-XXXXX
5. Create initial status log
6. **Send Telegram confirmation:** "Your shipment AFCON-[ID] is confirmed. Track: [URL]"
7. **Send email** receipt & tracking link
8. Schedule pickup notification (48hrs before)
9. Return success response

**Output:** Booking confirmed, tracking URL, Telegram sent status

### 9.3 Workflow 3: Shipment Status Update & Notification

**Trigger:** Admin updates status in dashboard  
**Duration:** 1-2 seconds

**Steps:**
1. Validate admin token
2. Update cargo_status_log
3. Update cargo_bookings.status
4. Check if delayed
5. **Send Telegram:** "[Location]. ETA: [Time]. Reason: [if delayed]"
6. Send email with status update
7. Log event to analytics
8. Mark telegram_sent = TRUE
9. Return success

**Output:** Status updated, Telegram sent, event logged

### 9.4 Workflow 4: Passenger Ticket Generation & E-Ticket

**Trigger:** Passenger payment confirmed  
**Duration:** 2-3 seconds

**Steps:**
1. Verify payment
2. Create passenger_tickets record
3. Update seat_inventory: status = "booked"
4. Generate ticket ID: AFCON-TKT-YYYYMMDD-XXXXX
5. Generate QR code
6. Create PDF e-ticket (Name, Seat, Date, Time, QR)
7. **Send Telegram:** "Ticket AFCON-TKT-[ID]. Seat 12B. Depart 7:00 AM"
8. **Send email:** e-ticket PDF attachment
9. Schedule 24-hour & 2-hour reminders
10. Return ticket details

**Output:** E-ticket PDF, Telegram confirmation, QR code

### 9.5 Workflow 5: Pre-Boarding Telegram Reminders

**Trigger:** Scheduled cron job (24hrs & 2hrs before departure)  
**Duration:** 1 second per passenger

**Steps (for each ticket):**
1. Fetch ticket + schedule details
2. Calculate gate assignment
3. **24hrs before:** Send Telegram: "Reminder: Bus departs in 24hrs. Gate [X]. Arrive 30min early"
4. Mark reminder_24h_sent = TRUE
5. **2hrs before:** Send Telegram: "Final boarding call. Bus departs in 2 hours. Gate [X]"
6. Mark reminder_2h_sent = TRUE

**Output:** Reminders sent to all passengers, database updated

### 9.6 Workflow 6: Delay Notification

**Trigger:** Admin marks shipment/bus as delayed  
**Duration:** 1-2 seconds

**Steps:**
1. Fetch all affected customers (cargo or passengers)
2. **Send Telegram:** "Your journey is running [X] mins late. New ETA: [time]. Reason: [cause]"
3. Send email with detailed explanation
4. Log event
5. Return confirmation

**Output:** All customers notified via Telegram, email sent

---

## 10. FRONTEND STRUCTURE

### 10.1 Page Architecture

```
/
├── Home.jsx (Homepage with service toggle)
├── /cargo
│   ├── Quote.jsx (Quote calculator)
│   ├── Booking.jsx (Booking form)
│   └── Track.jsx (Tracking page)
├── /passenger
│   ├── Search.jsx (Trip search & results)
│   ├── Book.jsx (Seat selection & booking)
│   └── Ticket.jsx (E-ticket display)
├── /admin
│   ├── Dashboard.jsx (Overview)
│   ├── Cargo.jsx (Shipment management)
│   ├── Passenger.jsx (Ticket management)
│   ├── Reports.jsx (Analytics)
│   └── Settings.jsx (Configuration)
├── /account
│   ├── Login.jsx (Auth)
│   ├── Register.jsx (Sign up)
│   └── Profile.jsx (User settings - Telegram ID)
└── /shared
    ├── FAQ.jsx
    ├── Contact.jsx (Telegram bot link)
    ├── Privacy.jsx
    └── Terms.jsx
```

### 10.2 Styling Approach

**Framework:** Tailwind CSS

**Color Palette:**
- Primary: #0088CC (Telegram blue)
- Success: #34C759 (Delivery green)
- Warning: #FF9500 (Delay orange)
- Danger: #FF3B30 (Error red)
- Neutral: #F5F5F5 (Light gray)

**Typography:**
- Display: Poppins (bold)
- Body: Inter (regular)
- Mono: JetBrains Mono (IDs)

**Responsive Breakpoints:**
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

### 10.3 Performance Targets

- First Contentful Paint: <1.2s
- Largest Contentful Paint: <1.8s
- Time to Interactive: <3s
- Bundle Size: <150KB gzipped

---

## 11. ADMIN DASHBOARD

### 11.1 Dashboard Sections

**Overview Tab**
- KPIs: Today's shipments, tickets, revenue (FCFA/NGN)
- Weekly revenue chart (cargo vs passenger)
- Active alerts: Delayed shipments, failed payments
- Last 10 transactions with status

**Cargo Management**
- Shipment list with filters (status, route, date)
- Bulk status update interface
- Trigger manual Telegram notifications
- View customer details & contact info

**Passenger Management**
- Ticket list by bus and date
- Bus manifests (full passenger roster)
- Check-in status (QR scanner)
- Send Telegram reminders manually if needed

**Reports**
- Revenue breakdown (cargo volume, passenger tickets)
- Route analytics (top routes, avg fare)
- On-time delivery percentage
- Customer satisfaction ratings
- Export to CSV/PDF

**Settings**
- Route & pricing management
- Bus schedule creation/editing
- Staff account management
- Business hours configuration
- Telegram bot token management

---

## 12. CONTENT & BRAND GUIDELINES

### 12.1 Brand Voice

**Tone:** Professional, trustworthy, clear, action-oriented  
**Values:** Reliability, transparency, respect, safety  
**Key Messaging:**
- "Track your journey in real-time via Telegram"
- "Instant quotes, reliable delivery, zero hidden costs"
- "10% guarantee on every shipment"
- "Comfortable journeys across borders"

### 12.2 Accessibility

- WCAG 2.1 Level AA compliance
- Contrast ratio ≥ 4.5:1 for text
- Keyboard navigation fully supported
- Alt text for all images
- Form labels always visible

---

## 13. WEBSITE SITEMAP & NAVIGATION

### Main Navigation Structure

```
HOME
├── SHIP CARGO
│   ├── Get Quote
│   ├── Track Shipment
│   ├── Pricing & Routes
│   └── Corporate Accounts
├── BOOK TRAVEL
│   ├── Find Trips
│   ├── Check Ticket
│   ├── Travel Guide
│   └── Group Bookings
├── ABOUT US
│   ├── Company Story
│   ├── Fleet & Equipment
│   ├── Team
│   └── Careers
├── SERVICES
│   ├── Cargo Services
│   ├── Customs Clearance
│   ├── Warehousing
│   └── Express Delivery
├── COVERAGE
│   ├── Cameroon Branches
│   ├── Nigeria Branches
│   └── Interactive Route Map
├── SUPPORT
│   ├── FAQs (Cargo & Passenger)
│   ├── Telegram Support Bot
│   ├── Contact Us
│   └── Help Center
├── RESOURCES
│   ├── Blog (Travel tips, guides)
│   ├── News
│   └── Downloads
└── ACCOUNT
    ├── Login / Register
    ├── My Bookings
    ├── My Tickets
    └── Profile (Link Telegram ID)
```

### Trust-Building Elements

- **Live cargo tracking** with real-time Telegram updates
- **Instant quote calculator** — no manual follow-up
- **Interactive route map** showing coverage
- **Customer testimonials** (shippers + travelers)
- **Fleet gallery** (buses & trucks)
- **10% insurance guarantee** badge
- **Company profile PDF** (CAC, licenses)
- **English / French switcher**
- **Telegram bot link** in footer & support pages
- **Security badges** (SSL, Paystack, Flutterwave)

---

## 14. DEPLOYMENT & DEVOPS

### 14.1 Deployment Platform

**Platform:** Netlify  
**Build Tool:** Vite (React)  
**Version Control:** GitHub  
**CI/CD:** Netlify auto-builds on push

### 14.2 Environment Variables (Production)

```
REACT_APP_SUPABASE_URL              = https://[project].supabase.co
REACT_APP_SUPABASE_ANON_KEY         = eyJ...
VITE_PAYSTACK_PUBLIC_KEY            = pk_live_xxx
VITE_FLUTTERWAVE_PUBLIC_KEY         = FLWPUBK_LIVE_xxx
VITE_TELEGRAM_BOT_TOKEN             = 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
VITE_ANTIGRAVITY_WEBHOOK_URL        = https://api.antigravity.xyz/webhooks/xxx
REACT_APP_RESEND_API_KEY            = re_xxx
REACT_APP_ANALYTICS_DOMAIN          = afrique-con.com
```

### 14.3 Monitoring

| Tool | Purpose | Tier |
|------|---------|------|
| Sentry | Error tracking, alerts | Free (5K events/month) |
| Netlify Analytics | Page views, performance | Free |
| Plausible | Visitor analytics | Free tier |
| Supabase Logs | Database monitoring | Free |
| Telegram Bot Logs | Message delivery tracking | Free |

---

## 15. TIMELINE & MILESTONES

### Phase Overview

| Phase | Duration | Scope |
|-------|----------|-------|
| Phase 1: MVP | 8 weeks | Homepage, quote, booking, workflows, payments |
| Phase 2: Full Platform | 4 weeks | Admin dashboard, tracking, reporting |
| Phase 3: Launch | 2 weeks | Testing, training, go-live |
| Phase 4: Post-Launch | Ongoing | Monitoring, optimization, feedback |

### Phase 1 — Week-by-Week Breakdown

**Week 1-2: Setup & Architecture**
- GitHub repo setup
- Netlify project creation
- Supabase database + tables
- Antigravity workflow templates
- Telegram bot creation (BotFather)
- Test payment accounts (Paystack, Flutterwave)

**Week 3-4: Frontend Development**
- React scaffolding with Vite
- Tailwind CSS setup
- Component library (buttons, inputs, modals)
- Homepage with service toggle
- Cargo quote form & display
- Passenger trip search & results
- Auth pages (login/register)

**Week 5-6: Backend & Workflows**
- Supabase RLS policies
- Antigravity: Quote generation
- Antigravity: Booking confirmation + Telegram
- Antigravity: Status updates + Telegram
- Antigravity: Ticket generation + Telegram
- 9 core API endpoints

**Week 7: Payments & Messaging**
- Paystack integration
- Flutterwave integration
- Telegram Bot API setup
- Webhook handlers (payment + Telegram)
- SMS-to-Telegram routing (if needed)
- Test payment flows

**Week 8: Testing & Go-Live Prep**
- Load testing (100 concurrent users)
- Security testing (HTTPS, XSS, CSRF)
- Mobile responsiveness QA
- Cross-browser testing
- Performance optimization
- Staging deployment
- Telegram bot testing with real users

---

## 16. BUDGET & COSTS

### 16.1 Monthly Operational Cost (Steady State)

| Service | Free Tier | Cost |
|---------|-----------|------|
| Netlify | 300 builds, 100 GB bandwidth | Free |
| Supabase | 500 MB DB, 1 GB storage, 2M calls | Free |
| Paystack | Per-transaction | 1.5% + ₦10 |
| Flutterwave | Per-transaction | 1.4% + 50 FCFA |
| **Telegram Bot API** | **Unlimited messages** | **FREE** |
| Resend Email | 100/day free | Free / $20 |
| Antigravity | Workflows | $0-$50 |
| Plausible Analytics | 10K events free | Free |
| Sentry | 5K events/month | Free |
| Domain + SSL | Netlify SSL included | $15/year |
| **TOTAL (Steady State)** | | **$15-65/month** |

### 16.2 Cost Savings with Telegram

| Item | Africa's Talking (Old) | Telegram (New) | Savings |
|------|---|---|---|
| 1,000 SMS/month | $65 | $0 | **$65/month** |
| WhatsApp integration | ~$100/month | $0 (Telegram) | **$100/month** |
| **Annual savings** | **$1,980** | **$0** | **$1,980/year** |

### 16.3 Initial Setup Cost

| Item | Cost |
|------|------|
| Domain registration (1 year) | $15 |
| Antigravity setup (labour: 8 hrs) | $200 |
| **Total Initial** | **~$215 + labour** |

---

## 17. RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Payment gateway downtime | High | Fallback to cash; retry logic |
| Antigravity workflow failure | High | Logging & alerts; manual process |
| Telegram API downtime | Medium | Fallback to email; queue system |
| Route/pricing data errors | Medium | Admin update interface; tests |
| Database outage | High | Supabase daily backups; RTO 1hr |
| DDoS attack | High | Netlify DDoS protection; rate limit |
| Data breach | Critical | Encryption at rest; RLS policies |
| Staffing issues | Medium | Process documentation; knowledge base |

---

## 18. FUTURE ENHANCEMENTS

### Short-Term (3-6 Months)

**Cargo:**
- Telegram `/quote` command for instant quoting
- Driver mobile app with real-time tracking
- B2B API for corporate integrations
- Loyalty program (points per shipment)

**Passenger:**
- Mobile app (React Native) for tickets
- In-app wallet with saved payment methods
- Seat preference pre-booking
- Travel document OCR verification

**Shared:**
- Multi-language expansion (Pidgin, Arabic)
- Advanced analytics dashboard

### Medium-Term (6-12 Months)

**Cargo:**
- Insurance add-ons (theft, damage, loss)
- Freight forwarding for intercontinental routes
- Predictive delivery time (ML)

**Passenger:**
- Real-time bus GPS tracking (Telegram updates)
- Travel insurance & cancellation protection
- Group/corporate packages
- Integration with hotels + tours

### Long-Term (12+ Months)

**Cargo:**
- Blockchain proof-of-delivery
- Route expansion (Ghana, Ivory Coast, etc.)

**Passenger:**
- AI demand forecasting
- Dynamic pricing models
- Multi-language chatbot

---

## 19. SUCCESS METRICS & KPIs

### User Acquisition

| Metric | Month 1 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Unique Website Visitors | 500 | 5,000 | 20,000 |
| Cargo Quotes Generated | 50 | 500 | 2,000 |
| Bookings Completed | 6 | 100 | 500 |
| Passenger Tickets | 20 | 200 | 1,000 |
| Registered Users | 30 | 300 | 1,500 |
| Telegram Subscribers | 25 | 250 | 1,200 |

### Engagement & Conversion

| Metric | Target |
|--------|--------|
| Quote-to-Booking Conversion | 12% |
| Booking-to-Payment Rate | 95% |
| Repeat Customer Rate | 40% by Month 6 |
| Customer Satisfaction | 4.5+ / 5.0 |
| Support Response Time | <2 hours (Telegram) |
| Telegram Message Open Rate | 85%+ |

### Financial

| Metric | Month 6 | Year 1 |
|--------|---------|---------|
| Average Booking Value | ₦50,000 (cargo) + ₦12,000 (ticket) | No change |
| Monthly Revenue | ₦3-5M | ₦20-30M |
| Customer Acquisition Cost | ₦5,000 | ₦3,000 |
| Lifetime Value | ₦500,000 | ₦1M |
| Gross Margin | 15-20% | 20-25% |

---

## 20. GLOSSARY & TERMINOLOGY

| Term | Definition |
|------|-----------|
| **FTL** | Full Truck Load — entire truck capacity reserved |
| **LTL** | Less Than Truck Load — shared truck space |
| **FCFA** | West African CFA franc (Cameroon currency) |
| **NGN** | Nigerian Naira (Nigeria currency) |
| **2.5× Multiplier** | Fixed conversion: NGN = FCFA × 2.5 |
| **Booking ID** | Cargo reference: AFCON-YYYYMMDD-XXXXX |
| **Ticket ID** | Passenger reference: AFCON-TKT-YYYYMMDD-XXXXX |
| **48-hr Rule** | Bookings must be confirmed 48 hours before departure |
| **Express Surcharge** | +25,000 FCFA for bookings within 48-hour window |
| **Telegram Bot** | Automated bot (@afrique_con_bot) for notifications |
| **Telegram ID** | User's unique Telegram identifier for notifications |
| **E-Ticket** | Electronic ticket (PDF + QR code via Telegram) |
| **Manifest** | Complete passenger list for a trip |
| **RLS** | Row-Level Security (database permissions) |
| **Webhook** | HTTP callback from payment gateway or Telegram |

---

## APPENDIX A: SAMPLE DATA

### Cargo Pricing Examples

**Example 1: Standard Shipment**
```
Origin: Douala
Destination: Lagos
Weight: 2,500 kg (exceeds 20kg limit)
Cargo Type: General
Customer: Nigerian

Calculation:
Base Rate (FCFA): 90,000
Surcharge (2,500 kg = 250 kg over limit): 5 × 5,000 = 25,000 FCFA
Total (FCFA): 115,000
Total (NGN): 115,000 × 2.5 = 287,500

Booking: Confirmed 48+ hours in advance → NO express surcharge
Notification: "Shipment AFCON-20240629-001 confirmed. Track: [URL]" (Telegram)
```

**Example 2: Express Shipment (within 48hrs)**
```
Booking requested: 30 hours before departure
Express Surcharge: +25,000 FCFA
Total (FCFA): 115,000 + 25,000 = 140,000
Total (NGN): 140,000 × 2.5 = 350,000

Notification: "EXPRESS booking confirmed. Higher cost due to 48-hr window." (Telegram)
```

### Passenger Pricing Examples

**Example 1: Single Adult Ticket**
```
Route: Douala → Lagos
Base Fare (FCFA): 48,000
Passenger Type: Adult (0% discount)
Final Price (FCFA): 48,000
Final Price (NGN): 48,000 × 2.5 = 120,000
Seat: 12B (Window)

Notification: "Ticket AFCON-TKT-20240629-001. Seat 12B. Depart 7:00 AM" (Telegram)
Reminders: 24 hours before & 2 hours before (via Telegram)
```

**Example 2: Student with Discount & Extra Luggage**
```
Base Fare (FCFA): 48,000
Discount (Student, -10%): -4,800 FCFA
Subtotal (FCFA): 43,200
Extra Luggage (1 item): +2,000 NGN = 800 FCFA
Final Price (FCFA): 44,000
Final Price (NGN): 44,000 × 2.5 = 110,000
```

### Branch Contacts

**Cameroon:**
- Yaoundé: +237 678197361
- Douala: +237 678197346 / +237 678197360
- Buea: +237 678197346

**Nigeria:**
- Lagos: +234 902 9072330
- Abuja: +234 810 4292492
- Onitsha: +234 704 5337032

---

## DOCUMENT APPROVAL & SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | TBD | ___________ | _____ |
| Technical Lead | TBD | ___________ | _____ |
| Finance Manager | TBD | ___________ | _____ |
| Operations Lead | TBD | ___________ | _____ |

---

**END OF DOCUMENT v2.1**

**Document Version:** 2.1 (Telegram Integration)  
**Last Updated:** June 2026  
**Next Review:** After Phase 1 completion (8 weeks)  
**Contact:** product@afrique-con.com

**Key Changes in v2.1:**
- ✅ Africa's Talking SMS replaced with Telegram Bot API (free)
- ✅ WhatsApp Business replaced with Telegram (no licensing needed)
- ✅ All notifications now Telegram-based
- ✅ Monthly cost reduced from $80-130 to $15-65 (saves ~$65/month)
- ✅ Year 1 cost reduced from $3,500-4,000 to $1,600-1,700
- ✅ 25+ references to Telegram throughout document
- ✅ Telegram ID stored in users table for direct messaging
- ✅ Telegram message logging for audits
- ✅ Telegram webhook endpoint documented
- ✅ Telegram bot commands specified (/quote, /track, /ticket, /help)
