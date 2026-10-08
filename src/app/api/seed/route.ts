import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log("Starting DB Seed...");
    
    // 1. Create a dummy chapter
    const { data: chapter, error: chErr } = await supabase.from('chapters').insert({
      class_level: 11,
      name: 'Physics: Live Leaderboard Test'
    }).select().single();
    
    if (chErr) throw chErr;

    // 2. Create a dummy test
    const { data: test, error: tErr } = await supabase.from('tests').insert({
      chapter_id: chapter.id,
      title: 'Global Grand Test',
      duration_minutes: 15,
      is_published: true
    }).select().single();

    if (tErr) throw tErr;

    // 3. Create dummy users via signUp
    const users = [
      { email: 'ankita@sumitian.com', name: 'Ankita Verma', mobile: '9999999991', score: 98 },
      { email: 'rohan@sumitian.com', name: 'Rohan Sharma', mobile: '9999999992', score: 95 },
      { email: 'tushar@sumitian.com', name: 'Tushar (Live)', mobile: '9999999993', score: 92 },
    ];
    
    for (const u of users) {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: u.email,
        password: 'password123'
      });
      
      if (authData.user) {
        // Insert profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: u.name,
          mobile_number: u.mobile,
          parent_mobile: '1234567890',
          class_level: 11,
          role: 'student'
        });
        
        // Insert test attempt
        await supabase.from('test_attempts').insert({
          test_id: test.id,
          user_id: authData.user.id,
          score: u.score,
          total_questions: 100
        });
      }
    }
    
    return NextResponse.json({ success: true, message: 'Live data successfully seeded to Supabase!' });
  } catch (error: any) {
    console.error("Seed error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
