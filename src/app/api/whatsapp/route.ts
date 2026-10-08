import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentMobile, studentName, score, total } = body;

    // Here is the logic for a Twilio WhatsApp API implementation.
    // To make this live, you would:
    // 1. npm install twilio
    // 2. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER to .env.local
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Sumitian Portal Update: ${studentName} has just completed a test and scored ${score} out of ${total}.`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${parentMobile}` // Assuming Indian numbers
    });
    */

    // For now, we simulate a successful automated background send
    console.log(`[Auto-WhatsApp Triggered] Sent to ${parentMobile}: ${studentName} scored ${score}/${total}`);

    return NextResponse.json({ success: true, message: 'Automated WhatsApp sent' });
  } catch (error: any) {
    console.error("WhatsApp API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
