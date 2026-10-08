'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (data) setStudents(data);
    setLoading(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || s.mobile_number.includes(search);
    const matchesClass = classFilter === 'all' || String(s.class_level) === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
          &larr; Back to Admin Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: 800 }}>Manage Students</h1>
          <Link href="/admin/register" className="btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
            + Add Student
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'var(--surface)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Search Students</label>
            <input 
              type="text" 
              placeholder="Search by name or mobile number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '1.1rem' }}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Filter by Class</label>
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '1.1rem', background: '#FAFAFA' }}
            >
              <option value="all">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading students...</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                No students found.
              </div>
            ) : (
              filteredStudents.map(student => (
                <div key={student.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--surface)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{student.full_name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Class {student.class_level} • Mobile: {student.mobile_number} • Parent: {student.parent_mobile}
                    </p>
                  </div>
                  <div>
                    <Link href={`/admin/students/${student.id}`} style={{ padding: '0.5rem 1rem', background: '#E0F2FE', color: '#0369A1', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                      Edit Details &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
