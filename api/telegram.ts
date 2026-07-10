import { createClient } from '@supabase/supabase-js';

// Environment Variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
const geminiKey = process.env.VITE_GEMINI_3_5_FLASH_KEY || process.env.VITE_GEMINI_3_FLASH_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const SYSTEM_PROMPT = `You are the Afrique-con AI Travel Assistant, a friendly and knowledgeable helper for Afrique-con Plc — a cross-border transport company operating between Cameroon and Nigeria.

Key facts you know:
- Routes: Douala ↔ Lagos, Yaoundé ↔ Abuja, and surrounding cities
- Cargo pricing: 1,000 FCFA / kg flat rate (≥100 kg negotiated). Heavy equipment: +15% surcharge. Express (<48h before departure): +20% surcharge.
- Passenger fares: Douala↔Lagos ~15,000–25,000 FCFA. Yaoundé↔Abuja ~20,000–30,000 FCFA.
- Ticket discounts: Student 10%, Senior (60+) 15%, Child (<12) 20%
- Free luggage: 20 kg per passenger. Extra: 1,000 FCFA / 2,500 ₦ per kg.
- Bus capacity: 48 seats per bus
- Payment: Paystack (NGN) or Flutterwave (FCFA)
- Tracking: Real-time tracking available via /track command
- Contact/Support: Telegram @Afriquecon_bot (24/7)

Rules:
- Only answer questions about Afrique-con services, routes, pricing, baggage, booking, tracking, customs, and policies.
- If asked something outside this scope, politely redirect to Afrique-con topics.
- Be concise, friendly, and helpful. Use emojis sparingly.
- Do NOT make up specific schedule times — tell users to check the website or use /quote.`;

// Send Telegram Message
async function sendMessage(chatId: string | number, text: string, parseMode = 'Markdown') {
  if (!telegramBotToken) {
    console.error('TELEGRAM_BOT_TOKEN is missing');
    return;
  }
  
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: parseMode
    })
  });
}

// Generate AI Fallback Response
async function generateAIResponse(prompt: string): Promise<string> {
  if (!geminiKey) {
    return "I'm sorry, I don't understand that command. Please use /help to see what I can do!";
  }
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nUser message: " + prompt }] }]
      }),
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Please try a command like /help.";
  } catch (e) {
    console.error("AI Error:", e);
    return "I'm having trouble thinking right now. Please try a command like /help.";
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    
    // Ignore if not a message
    if (!body?.message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();
    const username = body.message.from.username || body.message.from.first_name || 'User';

    // Track user mapping
    if (username) {
      await supabase
        .from('telegram_users')
        .upsert({ username: username, chat_id: chatId })
        .catch(err => console.error('Failed to map user', err));
    }

    // Command Router
    if (text.startsWith('/start')) {
      const welcomeMsg = `👋 Welcome to *Afrique-con*, ${username}!

I am your AI Travel & Cargo Assistant. Here's what I can do:

📦 /track [ID] - Track a shipment (e.g. /track AFCON-1234)
💵 /quote - Get a cargo quote
🎫 /ticket - Manage your passenger tickets
🆘 /help - See FAQ & options
📞 /contact - Speak to a human

You can also ask me general questions about our routes, prices, or policies!`;
      await sendMessage(chatId, welcomeMsg);

    } else if (text.startsWith('/help')) {
      const helpMsg = `ℹ️ *Afrique-con Support*

*Commands:*
/track [Booking ID] - Real-time tracking
/quote - Redirects to our quote calculator
/ticket - Redirects to passenger booking
/contact - Speak to our support team

You can also just type your question normally, and my AI will try to answer it!`;
      await sendMessage(chatId, helpMsg);

    } else if (text.startsWith('/contact')) {
      await sendMessage(chatId, `📞 *Contact Afrique-con*\n\nCameroon: +237 678197361\nNigeria: +234 902 9072330\nEmail: support@afrique-con.com\n\nOur human agents are available 24/7.`);
      
    } else if (text.startsWith('/quote')) {
      await sendMessage(chatId, `💵 *Cargo Quotes*\n\nOur instant quote calculator is available on our website. Please visit:\nhttps://afrique-con.com/cargo/quote\n\nFor general pricing rules, just ask me!`);
      
    } else if (text.startsWith('/ticket')) {
      await sendMessage(chatId, `🎫 *Passenger Tickets*\n\nYou can search for trips and book tickets instantly on our website:\nhttps://afrique-con.com/passenger/search`);

    } else if (text.startsWith('/track')) {
      const parts = text.split(' ');
      if (parts.length < 2) {
        await sendMessage(chatId, `⚠️ Please provide your tracking ID.\nExample: \`/track AFCON-20260710-1234\``);
        return res.status(200).json({ ok: true });
      }
      
      const trackingId = parts[1].trim();
      
      const { data, error } = await supabase.rpc('track_cargo_shipment', { p_booking_id: trackingId });
      
      if (error || !data || data.length === 0) {
        await sendMessage(chatId, `❌ Could not find a shipment with ID: *${trackingId}*\n\nPlease check the ID and try again.`);
      } else {
        const cargo = data[0];
        let msg = `📦 *Shipment Status: ${cargo.booking_id}*\n\n`;
        msg += `📍 Route: *${cargo.origin}* → *${cargo.destination}*\n`;
        msg += `⚖️ Weight: ${cargo.weight_kg} kg\n`;
        msg += `🔔 Current Status: *${cargo.status.replace('_', ' ').toUpperCase()}*\n\n`;
        
        msg += `*Timeline:*\n`;
        cargo.logs.forEach((log: any) => {
          msg += `• ${new Date(log.timestamp).toLocaleString()}: ${log.status.replace('_', ' ').toUpperCase()}`;
          if (log.location) msg += ` - ${log.location}`;
          msg += `\n`;
        });
        
        await sendMessage(chatId, msg);
      }

    } else {
      // AI Fallback for conversational queries
      // Show thinking indicator (typing action)
      const actionUrl = `https://api.telegram.org/bot${telegramBotToken}/sendChatAction`;
      fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' })
      }).catch(() => {});

      const aiReply = await generateAIResponse(text);
      await sendMessage(chatId, aiReply);
    }

    return res.status(200).json({ ok: true });
    
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
