import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';


const interestsList = ['Study', 'Career', 'Fitness', 'Habits', 'Personal Goals', 'Projects', 'Finances', 'Reading', 'Productivity', 'Other'];
const timeAvailabilities = ['< 1 hour', '1–2 hours', '2–4 hours', '4–6 hours', '6+ hours'];
const trackMethods = ['Daily', 'Weekly', 'Monthly', 'All'];
const importanceList = ['Consistency', 'Completion', 'Time spent', 'Streaks', 'Goals achieved'];
const notificationList = ['Task reminders', 'Habit reminders', 'Goal deadlines', 'Daily progress reminder', 'Weekly summary'];

const Onboarding = ({ onComplete }) => {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [language, setLanguage] = useState('English');
  const [interests, setInterests] = useState([]);
  
  const [goals, setGoals] = useState([]);
  const [currentGoal, setCurrentGoal] = useState({ title: '', category: '', target_date: '', priority: 'Medium' });

  const [availability, setAvailability] = useState('');
  const [trackMethod, setTrackMethod] = useState([]);
  const [importantToYou, setImportantToYou] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const toggleArrayItem = (setter, item) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleAddGoal = () => {
    if (!currentGoal.title) return;
    setGoals([...goals, { ...currentGoal, id: Date.now().toString() }]);
    setCurrentGoal({ title: '', category: '', target_date: '', priority: 'Medium' });
  };

  const removeGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Submit preferences
      const preferences = {
        interests,
        availability,
        trackMethod,
        importantToYou,
        notifications
      };

      await fetch(`${API_BASE_URL}/api/profiles/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timezone, language, preferences })
      });

      // 2. Submit goals
      for (const goal of goals) {
        await fetch(`${API_BASE_URL}/api/goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(goal)
        });
      }

      // Complete onboarding
      localStorage.setItem('onboardingCompleted', 'true');
      onComplete();

    } catch (err) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2>Welcome to your Personal Tracker!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Let's customize your experience.</p>
            
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>What is your timezone?</span>
              <input 
                type="text" 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </label>
            
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>What is your preferred language?</span>
              <select 
                value={language} 
                onChange={e => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </label>
          </div>
        );
      case 2:
        return (
          <div className="onboarding-step">
            <h2>What do you want to track?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select all that apply.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {interestsList.map(item => (
                <button
                  key={item}
                  onClick={() => toggleArrayItem(setInterests, item)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer',
                    background: interests.includes(item) ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: interests.includes(item) ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${interests.includes(item) ? 'var(--accent-primary)' : 'var(--border-color)'}`
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="onboarding-step">
            <h2>What are your main goals?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>You can add multiple goals.</p>
            
            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <input type="text" placeholder="Goal (e.g. Get an internship)" value={currentGoal.title} onChange={e => setCurrentGoal({...currentGoal, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              <input type="text" placeholder="Category (e.g. Career)" value={currentGoal.category} onChange={e => setCurrentGoal({...currentGoal, category: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="date" value={currentGoal.target_date} onChange={e => setCurrentGoal({...currentGoal, target_date: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                <select value={currentGoal.priority} onChange={e => setCurrentGoal({...currentGoal, priority: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button onClick={handleAddGoal} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                <Plus size={16} /> Add Goal
              </button>
            </div>

            {goals.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Your Goals:</h4>
                {goals.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.25rem' }}>
                    <div>
                      <strong>{g.title}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({g.category} - {g.priority})</span>
                    </div>
                    <button onClick={() => removeGoal(g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="onboarding-step">
            <h2>Time Availability</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>How much time can you usually dedicate each day?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {timeAvailabilities.map(item => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="availability" checked={availability === item} onChange={() => setAvailability(item)} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="onboarding-step">
            <h2>Tracker Preferences</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How do you want to track progress?</p>
              {trackMethods.map(item => (
                <label key={item} style={{ display: 'block', marginBottom: '0.25rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={trackMethod.includes(item)} onChange={() => toggleArrayItem(setTrackMethod, item)} style={{ marginRight: '0.5rem' }} />
                  {item}
                </label>
              ))}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>What matters most to you?</p>
              {importanceList.map(item => (
                <label key={item} style={{ display: 'block', marginBottom: '0.25rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={importantToYou.includes(item)} onChange={() => toggleArrayItem(setImportantToYou, item)} style={{ marginRight: '0.5rem' }} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="onboarding-step">
            <h2>Notifications & Reminders</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Would you like reminders for...</p>
            {notificationList.map(item => (
              <label key={item} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={notifications.includes(item)} onChange={() => toggleArrayItem(setNotifications, item)} style={{ marginRight: '0.5rem' }} />
                {item}
              </label>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="onboarding-step" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>All Set!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We're ready to generate your personalized dashboard.</p>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '30px', background: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              {loading ? 'Generating Dashboard...' : 'Launch Tracker 🚀'}
            </button>
            {error && <div style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</div>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem' }}>
          {[1,2,3,4,5,6,7].map(num => (
            <div key={num} style={{ height: '4px', flex: 1, background: num <= step ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '2px', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ minHeight: '300px' }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={handleBack} 
            disabled={step === 1 || loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', cursor: step === 1 ? 'not-allowed' : 'pointer', opacity: step === 1 ? 0.3 : 1 }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          {step < 7 && (
            <button 
              onClick={handleNext}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--accent-primary)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
