'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [classLevel, setClassLevel] = useState('9');
  const [chapter, setChapter] = useState('');
  const [newChapter, setNewChapter] = useState('');
  
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState('15');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [published, setPublished] = useState(false);

  const [allChapters, setAllChapters] = useState<any[]>([]);

  useEffect(() => {
    const fetchChapters = async () => {
      const { data } = await supabase.from('chapters').select('*');
      if (data) setAllChapters(data);
    };
    fetchChapters();
  }, []);

  const filteredChapters = allChapters.filter(c => c.classLevel === classLevel);

  const handleManualCreate = () => {
    setResult([{ q: 'New Question', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 'Option A' }]);
    setPublished(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    setPublished(false);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/admin/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setResult(data.questions);
      setLoading(false);
    } catch (error: any) {
      alert("Error: " + error.message);
      setLoading(false);
    }
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updated = [...result];
    updated[index][field] = value;
    setResult(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...result];
    updated[qIndex].options[optIndex] = value;
    setResult(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = [...result];
    updated.splice(index, 1);
    setResult(updated);
  };

  const addQuestion = () => {
    const updated = [...(result || [])];
    updated.push({
      q: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 'Option A'
    });
    setResult(updated);
  };

  const handlePublish = async () => {
    try {
      // Save new chapter if needed
      let finalChapterId = chapter;
      if (chapter === 'new' && newChapter) {
        const { data: chapData, error: chapErr } = await supabase
          .from('chapters')
          .insert({ name: newChapter, class_level: parseInt(classLevel) })
          .select()
          .single();
          
        if (chapErr) throw chapErr;
        finalChapterId = chapData.id;
      }
      
      // Save the newly generated test
      const { data: testData, error: testErr } = await supabase
        .from('tests')
        .insert({
          chapter_id: finalChapterId,
          title: testName,
          duration_minutes: parseInt(duration) || 15,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          is_published: true
        })
        .select()
        .single();
        
      if (testErr) throw testErr;

      // Insert all questions
      const qsToInsert = result.map((q: any) => ({
        test_id: testData.id,
        question_text: q.q,
        option_a: q.options[0] || '',
        option_b: q.options[1] || '',
        option_c: q.options[2] || '',
        option_d: q.options[3] || '',
        correct_option: q.correct
      }));

      const { error: qErr } = await supabase.from('questions').insert(qsToInsert);
      if (qErr) throw qErr;
      
      setPublished(true);
      setTimeout(() => {
        router.push('/admin/tests');
      }, 1500);
    } catch (e: any) {
      alert("Error saving test: " + e.message);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '2rem', fontWeight: 800 }}>Upload Question Paper</h1>
      
      <form onSubmit={handleUpload} className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface)' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Class Level</label>
            <select value={classLevel} onChange={e => { setClassLevel(e.target.value); setChapter(''); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chapter</label>
            <select value={chapter} onChange={e => setChapter(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <option value="">-- Select Chapter --</option>
              {allChapters.filter(c => String(c.class_level) === classLevel).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="new">+ Add New Chapter</option>
            </select>
          </div>
        </div>

        {chapter === 'new' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--accent)' }}>New Chapter Name</label>
            <input type="text" value={newChapter} onChange={e => setNewChapter(e.target.value)} placeholder="e.g. Optics" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--primary)', background: '#FAFAFA' }} required />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Test Name</label>
            <input type="text" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Motion Weekly Test" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Duration (mins)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Starts At (Live Time)</label>
            <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Expires At (Deadline)</label>
            <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }} required />
          </div>
        </div>

        <div style={{ border: '2px dashed var(--primary)', padding: '2rem', borderRadius: '16px', textAlign: 'center', background: '#FAFAFA', marginTop: '1rem' }}>
          <input 
            type="file" 
            accept=".pdf,image/*" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            style={{ display: 'block', margin: '0 auto' }} 
          />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 500 }}>Upload PDF or Image.<br/>The LLM will extract up to 25 MCQs automatically.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn-primary" disabled={loading || !file || (chapter==='new' && !newChapter) || chapter===''} style={{ flex: 1 }}>
            {loading ? '⏳ AI is extracting MCQs...' : 'Generate Test via AI'}
          </button>
          <button type="button" onClick={handleManualCreate} className="btn-outline" disabled={loading || (chapter==='new' && !newChapter) || chapter===''} style={{ flex: 1 }}>
            Create Manually (Type Qs)
          </button>
        </div>
      </form>

      {result && !published && (
        <div className="animate-fade-in" style={{ marginTop: '3rem', width: '100%', maxWidth: '800px' }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Review & Edit AI Generated Questions</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {result.map((q: any, i: number) => (
              <div key={i} className="glass-card" style={{ padding: '2rem', background: 'var(--surface)', position: 'relative' }}>
                <button 
                  type="button"
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

          <button type="button" onClick={addQuestion} style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: '#F3F4F6', color: 'var(--text-main)', border: '2px dashed #D1D5DB', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem' }}>
            + Add New Question
          </button>

          <button onClick={handlePublish} className="btn-primary" style={{ marginTop: '2rem', width: '100%', fontSize: '1.1rem', padding: '1rem' }}>Save Test & Publish to Students</button>
        </div>
      )}

      {published && (
        <div className="animate-fade-in" style={{ marginTop: '2rem', background: '#D1FAE5', color: '#065F46', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 700, fontSize: '1.25rem' }}>
          ✅ Test "{testName}" generated & published successfully! Redirecting...
        </div>
      )}
    </main>
  );
}
