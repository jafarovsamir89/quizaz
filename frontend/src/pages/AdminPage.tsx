import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../shared/ui/Toast';
import { Button } from '../shared/ui/Button';
import { ChevronLeft, CheckCircle2, XCircle, Trash2, Upload } from 'lucide-react';
import api from '../shared/api/base';


interface QuestionReport {
  id: number;
  questionId: number;
  userId: string;
  reason: string;
  status: string;
  createdAt: string;
  question: { textAz: string };
  user: { nickname: string };
}

interface Question {
  id: number;
  textAz: string;
  correctOption: string;
  status: string;
  difficulty: number;
  category: { nameAz: string };
}

type Tab = 'questions' | 'reports' | 'import';

export const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) navigate('/');
  }, [user, navigate]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions');
      setQuestions(res.data);
    } catch {
      showToast('Suallar yüklənmədi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/question-reports');
      setReports(res.data);
    } catch {
      showToast('Şikayətlər yüklənmədi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tab === 'questions') loadQuestions();
    if (tab === 'reports') loadReports();
  }, [tab, loadQuestions, loadReports]);

  const handleDeleteQuestion = async (id: number) => {
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      showToast('Silindi', 'success');
    } catch {
      showToast('Silinmədi', 'error');
    }
  };

  const handleToggleStatus = async (q: Question) => {
    const newStatus = q.status === 'active' ? 'draft' : 'active';
    try {
      await api.patch(`/questions/${q.id}`, { status: newStatus });
      setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, status: newStatus } : item));
      showToast(`Status: ${newStatus}`, 'success');
    } catch {
      showToast('Xəta', 'error');
    }
  };

  const handleResolveReport = async (id: number, action: 'resolved' | 'ignored') => {
    try {
      await api.patch(`/question-reports/${id}`, { status: action });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
      showToast('Yeniləndi', 'success');
    } catch {
      showToast('Xəta', 'error');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    let parsed: any[];
    try {
      parsed = JSON.parse(importText);
    } catch {
      showToast('JSON formatı yanlışdır', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/questions/import', parsed);
      showToast(`İmport: ${res.data.imported} sual əlavə edildi`, 'success');
      setImportText('');
    } catch {
      showToast('İmport xətası', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'questions', label: 'Suallar' },
    { key: 'reports', label: 'Şikayətlər' },
    { key: 'import', label: 'İmport' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
        >
          <ChevronLeft size={22} />
        </button>
        <h1>Admin Panel</h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: 'rgba(255,68,119,0.1)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,68,119,0.2)', color: 'var(--error)' }}>
          Admin
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 16, marginBottom: '1rem', flexShrink: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: 13, fontWeight: 700, fontSize: '0.85rem',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s',
              background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t.key ? 'var(--primary-gold)' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

        {/* Questions Tab */}
        {tab === 'questions' && (
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--primary-gold)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
            </div>
          ) : questions.map((q) => (
            <div key={q.id} className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  #{q.id} · {q.category?.nameAz} · Çətinlik: {q.difficulty}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{q.textAz}</div>
                <span style={{
                  display: 'inline-block', marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                  background: q.status === 'active' ? 'rgba(0,230,118,0.12)' : 'rgba(255,215,0,0.08)',
                  color: q.status === 'active' ? 'var(--success)' : 'var(--primary-gold)',
                }}>
                  {q.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleToggleStatus(q)}
                  title={q.status === 'active' ? 'Deaktiv et' : 'Aktiv et'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: q.status === 'active' ? 'var(--success)' : 'var(--text-muted)', padding: 4 }}
                >
                  {q.status === 'active' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  title="Sil"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Reports Tab */}
        {tab === 'reports' && (
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--primary-gold)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Şikayət yoxdur</div>
          ) : reports.map((r) => (
            <div key={r.id} className="glass-card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {r.user?.nickname} · #{r.questionId}
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                  background: r.status === 'open' ? 'rgba(255,68,119,0.1)' : 'rgba(255,255,255,0.05)',
                  color: r.status === 'open' ? 'var(--error)' : 'var(--text-muted)',
                }}>
                  {r.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: 4 }}><strong>Sual:</strong> {r.question?.textAz?.substring(0, 60)}...</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}><strong>Səbəb:</strong> {r.reason}</div>
              {r.status === 'open' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleResolveReport(r.id, 'resolved')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 10, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: 'var(--success)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Həll Olundu
                  </button>
                  <button
                    onClick={() => handleResolveReport(r.id, 'ignored')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Görmədən Keç
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Import Tab */}
        {tab === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                JSON formatında sualları yapışdırın. Nümunə:
              </div>
              <pre style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 10, overflow: 'auto', marginBottom: '0.75rem' }}>
{`[
  {
    "categoryId": 1,
    "textAz": "Sual mətni",
    "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
    "correctOption": "a",
    "difficulty": 1
  }
]`}
              </pre>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="JSON məlumatını buraya yapışdırın..."
                style={{
                  width: '100%', minHeight: 180, padding: '0.75rem', borderRadius: 12,
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
                  color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem',
                  outline: 'none', resize: 'vertical',
                }}
              />
            </div>
            <Button onClick={handleImport} isLoading={loading} style={{ width: '100%', height: 52 }}>
              <Upload size={18} />
              İmport Et
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
