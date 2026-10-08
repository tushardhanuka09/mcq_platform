'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminTestsView() {
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  
  const [classFilter, setClassFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      // Load chapters
      const { data: cData } = await supabase.from('chapters').select('*');
      if (cData) setAllChapters(cData);

      // Load tests
      const { data: tData } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
      if (tData) setAllTests(tData);
    };
    fetchData();
  }, []);

  const filteredChapters = classFilter === 'all' ? allChapters : allChapters.filter(c => String(c.class_level) === classFilter);
  
  const filteredTests = allTests.filter(t => {
    const chap = allChapters.find(c => c.id === t.chapter_id);
    if (!chap) return false;
    if (classFilter !== 'all' && String(chap.class_level) !== classFilter) return false;
    if (chapterFilter !== 'all' && t.chapter_id !== chapterFilter) return false;
    return true;
  });

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
          &larr; Back to Admin Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: 800 }}>Manage Tests</h1>
          <Link href="/admin/upload" className="btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
            + Upload New Test
          </Link>
        </div>
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'var(--surface)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Filter by Class</label>
            <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setChapterFilter('all'); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <option value="all">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Filter by Chapter</label>
            <select value={chapterFilter} onChange={e => setChapterFilter(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <option value="all">All Chapters</option>
              {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {filteredTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: '16px', color: 'var(--text-muted)' }}>
            No tests found for the selected filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredTests.map(test => {
              const chap = allChapters.find(c => c.id === test.chapter_id);
              return (
                <Link href={`/admin/tests/${test.id}`} key={test.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.5rem', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s', ...({ ':hover': { transform: 'scale(1.02)' } } as any) }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{test.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Class {chap?.class_level} • {chap?.name} • ⏱ {test.duration_minutes} mins
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ padding: '0.5rem 1rem', background: '#E0F2FE', color: '#0369A1', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600 }}>Edit Questions &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
