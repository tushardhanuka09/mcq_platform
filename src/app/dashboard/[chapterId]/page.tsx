'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ChapterTests() {
  const params = useParams();
  const router = useRouter();
  const [completedTests, setCompletedTests] = useState<Record<string, any>>({});

  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    const fetchTestsAndProgress = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        // Fetch completed tests from Supabase test_attempts
        const { data: attempts } = await supabase
          .from('test_attempts')
          .select('test_id, score')
          .eq('user_id', user.id);
          
        if (attempts) {
          const attemptDict: Record<string, any> = {};
          attempts.forEach((a: any) => attemptDict[a.test_id] = a);
          setCompletedTests(attemptDict);
        }
      }
      
      // Fetch tests for this chapter
      const { data: testsData } = await supabase
        .from('tests')
        .select('*')
        .eq('chapter_id', params.chapterId)
        .eq('is_published', true);
        
      if (testsData) {
        setTests(testsData);
      }
    };
    fetchTestsAndProgress();
  }, [params.chapterId]);

  return (
    <main className="container animate-fade-in" style={{ padding: '2rem 1rem', minHeight: '100vh' }}>
      <button onClick={() => router.back()} className="btn-outline" style={{ marginBottom: '2rem' }}>
        &larr; Back to Chapters
      </button>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2rem' }}>Available Tests</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {tests.map((test) => {
          const isCompleted = !!completedTests[test.id];
          const now = new Date();
          const startsAt = test.starts_at ? new Date(test.starts_at) : null;
          const expiresAt = test.expires_at ? new Date(test.expires_at) : null;
          
          const isNotLiveYet = startsAt && now < startsAt;
          const isExpired = expiresAt && now > expiresAt;
          const isLocked = isNotLiveYet; // Completed and Expired tests are clickable!

          return (
            <div key={test.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: isCompleted ? '1px solid #10B981' : '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>
                {test.title} {isCompleted && '✅'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>⏱ {test.duration_minutes} mins • Single Attempt</p>
              
              {test.starts_at && new Date() < new Date(test.starts_at) && (
                <p style={{ color: 'var(--primary-hover)', fontSize: '0.9rem', fontWeight: 700 }}>Starts at: {new Date(test.starts_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              )}
              {test.expires_at && (
                <p style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>Expires at: {new Date(test.expires_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              )}
              <Link 
                href={isLocked ? '#' : `/test/${test.id}`} 
                className={isCompleted ? "" : (isLocked ? "btn-outline" : "btn-primary")} 
                style={{ 
                  width: '100%', 
                  marginTop: 'auto', 
                  textAlign: 'center',
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '50px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  ...(isCompleted ? {
                    background: '#D1FAE5',
                    color: '#065F46',
                    border: '1px solid #10B981'
                  } : {}),
                  ...(isLocked ? {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    pointerEvents: 'none'
                  } : {})
                }}
              >
                {isCompleted ? 'View Results' : (isNotLiveYet ? 'Not Live Yet' : (isExpired ? 'Practice Mode (Late)' : 'Start Test'))}
              </Link>
            </div>
          )
        })}
      </div>
    </main>
  );
}
