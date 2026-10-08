'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Leaderboard() {
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('monthly'); // 'daily', 'monthly', 'test'
  const [selectedTestId, setSelectedTestId] = useState('');
  const [allTests, setAllTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchTests = async () => {
      const { data } = await supabase.from('tests').select('id, title');
      if (data) setAllTests(data);
    };
    fetchTests();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      let query = supabase
        .from('test_attempts')
        .select('*, profiles ( full_name )');

      const now = new Date();
      if (filterType === 'daily') {
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        query = query.gte('completed_at', startOfDay.toISOString());
      } else if (filterType === 'monthly') {
        // Use a rolling 30-day window so the leaderboard doesn't instantly empty on the 1st of the month!
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('completed_at', thirtyDaysAgo.toISOString());
      } else if (filterType === 'test' && selectedTestId) {
        query = query.eq('test_id', selectedTestId);
      }

      // If test mode is selected but no test is chosen, don't fetch yet
      if (filterType === 'test' && !selectedTestId) {
        setTopStudents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;
        
      if (data) {
        // Aggregate scores and times per user for cumulative leaderboards
        const userStats: Record<string, any> = {};
        
        data.forEach((attempt: any) => {
          // Ignore late/practice attempts (tolerate nulls for older tests)
          if (attempt.is_late === true) return;
          
          const uid = attempt.user_id;
          if (!uid) return;
          
          if (!userStats[uid]) {
            userStats[uid] = {
              name: attempt.profiles?.full_name || 'Unknown',
              totalScore: 0,
              totalTime: 0,
            };
          }
          userStats[uid].totalScore += attempt.score;
          userStats[uid].totalTime += (attempt.time_taken_seconds || 0);
        });

        // Convert to array and sort: Highest Score first, then Lowest Time
        const sortedArray = Object.values(userStats).sort((a, b) => {
          if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore; // Higher score wins
          }
          return a.totalTime - b.totalTime; // Lower time wins on tie
        });

        // Take top 10 and format
        const formatted = sortedArray.slice(0, 10).map((student: any, idx: number) => {
          const mins = Math.floor(student.totalTime / 60);
          const secs = student.totalTime % 60;
          return {
            rank: idx + 1,
            name: student.name,
            score: student.totalScore,
            time: `${mins}m ${secs}s`
          };
        });
        
        setTopStudents(formatted);
      }
      setLoading(false);
    };
    
    fetchLeaderboard();
  }, [filterType, selectedTestId]);

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '3.5rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 800 }}>🏆 Leaderboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => setFilterType('monthly')} className={filterType === 'monthly' ? "btn-primary" : "btn-outline"}>Monthly Overall</button>
        <button onClick={() => setFilterType('daily')} className={filterType === 'daily' ? "btn-primary" : "btn-outline"}>Daily Sprint</button>
        <button onClick={() => setFilterType('test')} className={filterType === 'test' ? "btn-primary" : "btn-outline"}>Specific Test</button>
      </div>

      {filterType === 'test' && (
        <div style={{ marginBottom: '2rem', width: '100%', maxWidth: '400px' }}>
          <select 
            value={selectedTestId} 
            onChange={(e) => setSelectedTestId(e.target.value)} 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '1.1rem' }}
          >
            <option value="">-- Choose a Test --</option>
            {allTests.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', background: 'var(--surface)', padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Fetching live global scores...</div>
        ) : topStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tests taken yet. Be the first!</div>
        ) : (
          topStudents.map((student, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: idx === topStudents.length - 1 ? 'none' : '1px solid var(--glass-border)', background: student.rank === 1 ? '#FEF3C7' : 'transparent', borderRadius: student.rank === 1 ? '12px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: student.rank <= 3 ? 'var(--accent)' : 'var(--text-muted)', width: '40px' }}>
                  #{student.rank}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{student.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 500 }}>⏱ {student.time}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{student.score} pts</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/dashboard" className="btn-primary" style={{ marginTop: '3rem' }}>
        &larr; Back to Dashboard
      </Link>
    </main>
  );
}
