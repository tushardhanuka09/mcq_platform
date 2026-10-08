import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { fullName, mobile } = await request.json();
    
    if (!fullName || !mobile) {
      return NextResponse.json({ error: 'Please provide both Full Name and Mobile Number.' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', fullName)
      .eq('mobile_number', mobile)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Student not found with this name and mobile combination.' }, { status: 400 });
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        fullName: user.full_name,
        mobile: user.mobile_number,
        parentMobile: user.parent_mobile,
        classLevel: String(user.class_level),
        role: user.role
      } 
    });

  } catch (error: any) {
    console.error("API Login Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
