'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';

export default function TestPage() {
  const { testId } = useParams();
  const router = useRouter();
  
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const [questions, setQuestions] = useState<any[]>([]);
  const [testData, setTestData] = useState<any>(null);
  const [isReattempt, setIsReattempt] = useState(false);
  const [attemptWasLate, setAttemptWasLate] = useState(false);

  useEffect(() => {
    const fetchTestAndQuestions = async () => {
      // 1. Fetch questions from Supabase
      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId);
        
      if (qData && qData.length > 0) {
        setQuestions(qData.map(q => {
          let opts = [];
          if (q.options) {
             opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          }
          if (opts.length === 0 && q.option_a) {
             opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
          }
          return {
             id: q.id,
             text: q.question_text,
             options: opts,
             correct: q.correct_option
          };
        }));
      } else {
        setQuestions([{ id: 1, text: 'No questions found for this test in the database.', options: ['OK'], correct: 'OK' }]);
      }
      
      const { data: tData } = await supabase.from('tests').select('*').eq('id', testId).single();
      if (tData) setTestData(tData);

      // 2. Check if already completed
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) return;
      
      const { data: attempt } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('test_id', testId)
        .single();
        
      if (attempt) {
        setIsFinished(true);
        setIsReviewing(true);
        // Note: we aren't saving selectedAnswers to DB right now, so review will just show score.
      }
    };
    
    fetchTestAndQuestions();
  }, [testId]);

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  const finishTest = async () => {
    setIsFinished(true);
    if (testId) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        
        const now = new Date();
        const isLate = (testData && testData.expires_at ? now > new Date(testData.expires_at) : false) || isReattempt;
        setAttemptWasLate(isLate);
        
        // Calculate total time taken
        const totalTimeAllowed = testData ? testData.duration_minutes * 60 : 15 * 60;
        const timeTaken = totalTimeAllowed - timeLeft;

        // 1. Insert Attempt into Supabase (This triggers WhatsApp via the local Bot!)
        await supabase.from('test_attempts').insert({
          test_id: testId as string,
          user_id: user.id,
          score: score,
          total_questions: questions.length,
          is_late: isLate,
          time_taken_seconds: timeTaken > 0 ? timeTaken : 0
        });

        // (We no longer need the /api/whatsapp fetch because the local Bot listens to Supabase directly)
      }
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FBBF24', '#10B981', '#3B82F6']
    });
  };

  const handleAnswer = (selected: string) => {
    if (selectedAnswers[currentQuestion] !== undefined) return; 

    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: selected });
    const isCorrect = selected === questions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setCorrectStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 3) {
          fireConfetti();
          setFeedback(`🔥 ${newStreak} IN A ROW! YOU ARE UNSTOPPABLE!`);
          setTimeout(() => setFeedback(''), 4000);
        }
        return newStreak;
      });
    } else {
      setCorrectStreak(0);
    }
  };

  const handleNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isReviewing) {
    return (
      <main className="container animate-fade-in" style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '2rem', fontWeight: 800 }}>Test Review</h1>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {questions.map((q, idx) => {
            const userAns = selectedAnswers[idx];
            const isCorrect = userAns === q.correct;
            return (
              <div key={idx} className="glass-card" style={{ background: 'var(--surface)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Q{idx + 1}. {q.text}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {q.options.map((opt: any, i: number) => {
                    let bg = '#F3F4F6';
                    let color = '#374151';
                    if (opt === q.correct) {
                      bg = '#D1FAE5'; color = '#065F46'; 
                    } else if (opt === userAns && !isCorrect) {
                      bg = '#FEE2E2'; color = '#B91C1C'; 
                    }
                    return (
                      <div key={i} style={{ padding: '0.75rem', borderRadius: '8px', background: bg, color: color, fontWeight: 500 }}>
                        {opt} {opt === userAns ? '(Your Answer)' : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => {
                setIsFinished(false);
                setIsReviewing(false);
                setScore(0);
                setCurrentQuestion(0);
                setSelectedAnswers({});
                setTimeLeft(testData ? testData.duration_minutes * 60 : 15 * 60);
                setIsReattempt(true);
              }} 
              className="btn-outline" 
              style={{ flex: 1 }}
            >
              🔄 Retake Test (Practice)
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ flex: 1 }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="container animate-fade-in" style={{ padding: '5rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', width: '100%', background: 'var(--surface)' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '1rem', fontWeight: 800 }}>Test Complete!</h1>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '2rem' }}>
            Your Score: <strong style={{ color: 'var(--primary)' }}>{score} / {questions.length}</strong>
          </p>
          
          {attemptWasLate ? (
            <div style={{ background: '#E5E7EB', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ color: '#4B5563', fontWeight: 600 }}>
                💡 This was a practice run. Your score was not saved to the leaderboard and parents were not notified.
              </p>
            </div>
          ) : (
            <div style={{ background: '#FEF3C7', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ color: '#92400E', fontWeight: 600 }}>
                📱 Your scorecard has been automatically sent to your parent&apos;s WhatsApp.
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setIsReviewing(true)} className="btn-outline" style={{ flex: 1 }}>
              Review Answers
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ flex: 1 }}>
              Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return <div style={{ padding: '5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>Loading Test Arena...</div>;
  }

  const q = questions[currentQuestion];
  const hasAnsweredCurrent = selectedAnswers[currentQuestion] !== undefined;

  return (
    <main className="container animate-fade-in" style={{ padding: '2rem 1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: timeLeft < 60 ? 'var(--danger)' : 'var(--accent)' }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {feedback && (
        <div className="animate-fade-in" style={{ position: 'fixed', top: '100px', background: '#FEF3C7', color: '#B45309', padding: '1rem 2rem', borderRadius: '50px', fontWeight: 800, fontSize: '1.25rem', zIndex: 100, boxShadow: '0 10px 30px rgba(251,191,36,0.3)', border: '2px solid #FDE68A' }}>
          {feedback}
        </div>
      )}

      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '3rem', background: 'var(--surface)' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '2rem', lineHeight: 1.4, fontWeight: 700 }}>
          {q.text}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {q.options.map((opt: any, i: number) => {
            const isSelected = selectedAnswers[currentQuestion] === opt;
            const isCorrectAnswer = opt === q.correct;
            let bg = 'transparent';
            let borderColor = '#E5E7EB';
            let color = '#374151';
            
            if (hasAnsweredCurrent) {
              if (isCorrectAnswer) {
                bg = '#D1FAE5'; borderColor = '#059669'; color = '#065F46';
              } else if (isSelected) {
                bg = '#FEE2E2'; borderColor = '#DC2626'; color = '#B91C1C';
              }
            }

            return (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)}
                disabled={hasAnsweredCurrent}
                className="btn-outline" 
                style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '1.1rem', borderRadius: '12px', borderColor, background: bg, color, opacity: (hasAnsweredCurrent && !isSelected && !isCorrectAnswer) ? 0.6 : 1 }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {hasAnsweredCurrent && (
          <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleNext} className="btn-primary">
               {currentQuestion + 1 < questions.length ? 'Next Question ➡️' : 'Submit Test ✔️'}
             </button>
          </div>
        )}

      </div>
    </main>
  );
}
