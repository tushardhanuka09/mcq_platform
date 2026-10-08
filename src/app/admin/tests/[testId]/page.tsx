'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function TestEditor() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [testData, setTestData] = useState<any>(null);
  
  useEffect(() => {
    const fetchTest = async () => {
      const { data: tData } = await supabase.from('tests').select('*').eq('id', testId).single();
      const { data: qData } = await supabase.from('questions').select('*').eq('test_id', testId);
      
      if (tData) {
        const parsedQuestions = (qData || []).map((q: any) => {
          let opts = [];
          if (q.options) {
             opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          }
          if (opts.length === 0 && q.option_a) {
             opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
          }
          return {
            q: q.question_text,
            options: opts,
            correct: q.correct_option
          };
        });
        
        setTestData({ ...tData, questions: parsedQuestions });
      }
    };
    fetchTest();
  }, [testId]);

  if (!testData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updated = { ...testData };
    updated.questions[index][field] = value;
    setTestData(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = { ...testData };
    updated.questions[qIndex].options[optIndex] = value;
    setTestData(updated);
  };

  const addQuestion = () => {
    const updated = { ...testData };
    updated.questions.push({
      q: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 'Option A'
    });
    setTestData(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = { ...testData };
    updated.questions.splice(index, 1);
    setTestData(updated);
  };

  const saveChanges = async () => {
    // 1. Delete old questions for this test
    await supabase.from('questions').delete().eq('test_id', testId);
    
    // 2. Insert new questions
    if (testData.questions.length > 0) {
      const qsToInsert = testData.questions.map((q: any) => ({
        test_id: testId,
        question_text: q.q,
        option_a: q.options[0] || '',
        option_b: q.options[1] || '',
        option_c: q.options[2] || '',
        option_d: q.options[3] || '',
        correct_option: q.correct
      }));
      await supabase.from('questions').insert(qsToInsert);
    }
    
    alert('Test updated successfully in the cloud!');
    router.push('/admin/tests');
  };

  const deleteTest = async () => {
    if (confirm("Are you sure you want to delete this ENTIRE test from the cloud? This action cannot be undone.")) {
      await supabase.from('tests').delete().eq('id', testId);
      alert('Test deleted successfully!');
      router.push('/admin/tests');
    }
  };

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <Link href="/admin/tests" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
          &larr; Back to Tests List
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: 800 }}>Edit Test: {testData.title}</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={deleteTest} style={{ padding: '0.75rem 1.5rem', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '50px', fontWeight: 700, cursor: 'pointer' }}>Delete Entire Test</button>
            <button onClick={saveChanges} className="btn-primary">Save Changes</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {testData.questions.map((q: any, i: number) => (
            <div key={i} className="glass-card" style={{ padding: '2rem', background: 'var(--surface)', position: 'relative' }}>
              <button 
                onClick={() => removeQuestion(i)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Delete
              </button>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Question {i + 1}</label>
                <textarea 
                  value={q.q}
                  onChange={(e) => handleQuestionChange(i, 'q', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {q.options.map((opt: string, j: number) => (
                  <div key={j}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Option {j + 1}</label>
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => handleOptionChange(i, j, e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>Correct Answer (Must match an option exactly)</label>
                <input 
                  type="text" 
                  value={q.correct}
                  onChange={(e) => handleQuestionChange(i, 'correct', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--primary)', background: '#FAFAFA' }}
                />
              </div>
            </div>
          ))}
        </div>

        {testData.questions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '12px' }}>
            No questions yet. Add one below!
          </div>
        )}

        <button onClick={addQuestion} style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: '#F3F4F6', color: 'var(--text-main)', border: '2px dashed #D1D5DB', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem' }}>
          + Add New Question
        </button>
        
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button onClick={saveChanges} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>Save All Changes</button>
        </div>
      </div>
    </main>
  );
}
