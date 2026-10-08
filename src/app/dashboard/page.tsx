'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [chapters, setChapters] = useState<any[]>([]);
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [todaysTests, setTodaysTests] = useState<any[]>([]);
  const [completedTestIds, setCompletedTestIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
      } else {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('class_level', parseInt(parsedUser.classLevel));
          
        const { data: attempts } = await supabase
          .from('test_attempts')
          .select('test_id')
          .eq('user_id', parsedUser.id);
          
        if (attempts) {
          setCompletedTestIds(attempts.map(a => a.test_id));
        }
          
        if (data) {
          setChapters(data);
          
          const chapterIds = data.map((c: any) => c.id);
          const now = new Date();
          const todayStart = new Date(); todayStart.setHours(0,0,0,0);
          const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
          
          const { data: testsData } = await supabase
            .from('tests')
            .select('*')
            .in('chapter_id', chapterIds)
            .order('starts_at', { ascending: true });
            
          if (testsData) {
            // Old tests that are always live (no schedule)
            const openTests = testsData.filter((t: any) => !t.starts_at && !t.expires_at);
            
            // Tests that have any scheduled interaction (start or end) TODAY
            const scheduledToday = testsData.filter((t: any) => {
              if (!t.starts_at && !t.expires_at) return false;
              const sDate = t.starts_at ? new Date(t.starts_at) : null;
              const eDate = t.expires_at ? new Date(t.expires_at) : null;
              
              const startsToday = sDate && sDate >= todayStart && sDate <= todayEnd;
              const endsToday = eDate && eDate >= todayStart && eDate <= todayEnd;
              const liveToday = sDate && eDate && sDate <= now && eDate >= now; // Currently crossing through today
              
              return startsToday || endsToday || liveToday;
            });

            setLiveTests(openTests);
            setTodaysTests(scheduledToday);
          }
        }
      }
    };
    fetchDashboard();
  }, [router]);

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <main className="container animate-fade-in" style={{ padding: '2rem 1rem', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Welcome, {user.fullName}!</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1.1rem' }}>Class {user.classLevel} Sumitian</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/leaderboard" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>🏆 Leaderboard</Link>
          <button className="btn-outline" onClick={() => { localStorage.removeItem('user'); router.push('/'); }}>Logout</button>
        </div>
      </header>

      {todaysTests.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--danger)', fontWeight: 700 }}>🚨 Today's Scheduled Tests</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {todaysTests.map(test => {
              const isCompleted = completedTestIds.includes(test.id);
              const now = new Date();
              const startsAt = test.starts_at ? new Date(test.starts_at) : null;
              const expiresAt = test.expires_at ? new Date(test.expires_at) : null;
              
              let statusMsg = 'Live Now! (Pending)';
              let statusColor = 'var(--primary-hover)';
              
              if (isCompleted) {
                statusMsg = 'Completed ✅';
                statusColor = 'var(--success)';
              } else if (startsAt && now < startsAt) {
                statusMsg = `Starts at ${startsAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                statusColor = 'var(--text-main)';
              } else if (expiresAt && now > expiresAt) {
                statusMsg = 'Expired (Practice Mode)';
                statusColor = 'var(--danger)';
              }

              return (
                <Link key={test.id} href={`/dashboard/${test.chapter_id}`} className="glass-card" style={{ display: 'block', textDecoration: 'none', borderLeft: `4px solid ${statusColor}` }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>{test.title}</h3>
                  <p style={{ color: statusColor, fontSize: '1rem', fontWeight: 700 }}>{statusMsg}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {liveTests.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--success)', fontWeight: 700 }}>🟢 Always Available</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {liveTests.map(test => {
              const isCompleted = completedTestIds.includes(test.id);
              let statusMsg = isCompleted ? 'Completed ✅' : 'Available';
              let statusColor = isCompleted ? 'var(--success)' : 'var(--primary-hover)';

              return (
                <Link key={test.id} href={`/dashboard/${test.chapter_id}`} className="glass-card" style={{ display: 'block', textDecoration: 'none', borderLeft: `4px solid ${statusColor}` }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>{test.title}</h3>
                  <p style={{ color: statusColor, fontSize: '1rem', fontWeight: 700 }}>{statusMsg}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>Select a Chapter</h2>
        
        {chapters.length === 0 ? (
          <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No chapters assigned for Class {user.classLevel} yet. Check back soon!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {chapters.map((chapter) => (
              <Link key={chapter.id} href={`/dashboard/${chapter.id}`} className="glass-card" style={{ display: 'block', textDecoration: 'none' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 600 }}>{chapter.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>View available tests &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
