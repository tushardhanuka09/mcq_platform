import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, mobile, parentMobile, classLevel } = body;


    // Generate a secure UUID directly
    const userId = crypto.randomUUID();

    // Create Profile Directly (bypassing Supabase Auth Email Rate Limits)
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
      mobile_number: mobile,
      parent_mobile: parentMobile,
      class_level: parseInt(classLevel),
      role: 'student'
    });

    // If there is an error, it might be the foreign key constraint we need to drop
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      user: { id: userId, fullName, mobile, classLevel: String(classLevel), role: 'student' } 
    });

  } catch (error: any) {
    console.error("API Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
