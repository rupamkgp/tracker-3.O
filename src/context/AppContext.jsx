import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { initialSubjects, weeklyTimetable, defaultTasks, initialSubjectCategories } from '../utils/initialData';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { token, user, onboardingCompleted, isLoading: authLoading } = useAuth();
  
  // Helper for API calls scoped with token
  const apiFetch = async (endpoint, method = 'GET', body = null) => {
    const options = { method, headers: {} };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_BASE_URL}/api${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  };

  const [isInitializing, setIsInitializing] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [subjectCategories, setSubjectCategories] = useState([]);
  const [dailyRecords, setDailyRecords] = useState({});
  const [studyPlans, setStudyPlans] = useState([]);
  const [weeklyReviews, setWeeklyReviews] = useState({});
  
  // Date handling
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Fetch initial data from Express API
  useEffect(() => {
    if (!token || !onboardingCompleted) return; // Wait until authenticated AND onboarded
    
    const fetchInitialData = async () => {
      try {
        const [catsRes, subsRes, recordsRes, plansRes, reviewsRes, timetableRes] = await Promise.all([
          apiFetch('/categories'),
          apiFetch('/subjects'),
          apiFetch('/daily_records'),
          apiFetch('/study_plans'),
          apiFetch('/weekly_reviews'),
          apiFetch('/weekly_timetable')
        ]);
        
        // Map Categories
        if (catsRes.data && catsRes.data.length > 0) {
          setSubjectCategories(catsRes.data.map(c => ({
            id: c.id,
            title: c.title,
            category: c.category,
            defaultType: c.default_type
          })));
        } else {
          setSubjectCategories([]);
        }

        // Map Subjects
        if (subsRes.data && subsRes.data.length > 0) {
          setSubjects(subsRes.data.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            category: s.category,
            progress: s.progress,
            currentTopic: s.current_topic
          })));
        } else {
          setSubjects([]);
        }

        // Map Daily Records
        if (recordsRes.data && recordsRes.data.length > 0) {
          const recordsMap = {};
          recordsRes.data.forEach(r => {
            recordsMap[r.date] = {
              date: r.date,
              dayName: r.day_name,
              classes: Array.isArray(r.classes) ? r.classes : [],
              tasks: r.tasks || {}
            };
          });
          setDailyRecords(recordsMap);
        } else {
          setDailyRecords({});
        }

        // Map Study Plans
        if (plansRes.data) {
          setStudyPlans(plansRes.data.map(p => ({
            id: p.id,
            subjectId: p.subject_id,
            startDate: p.start_date,
            endDate: p.end_date,
            targetMinutes: p.target_minutes,
            isActive: p.is_active
          })));
        }

        // Map Weekly Reviews
        if (reviewsRes.data) {
          const reviewsMap = {};
          reviewsRes.data.forEach(r => {
            reviewsMap[r.week_start_date] = {
              weekStartDate: r.week_start_date,
              bestAchievement: r.best_achievement,
              biggestProblem: r.biggest_problem,
              nextPriority: r.next_priority
            };
          });
          setWeeklyReviews(reviewsMap);
        }

        // Map Timetable
        if (timetableRes.data && timetableRes.data.length > 0) {
          const timetableMap = {};
          timetableRes.data.forEach(t => {
            timetableMap[t.day_name] = t.classes;
          });
          // Ensure all days exist
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          days.forEach(d => { if (!timetableMap[d]) timetableMap[d] = []; });
          setTimetable(timetableMap);
        } else {
          // Migration from local defaults
          setTimetable(weeklyTimetable);
          Object.entries(weeklyTimetable).forEach(async ([day, classes]) => {
            await apiFetch('/weekly_timetable', 'POST', {
              day_name: day,
              classes: classes
            });
          });
        }

      } catch (err) {
        console.error("Error fetching data from API:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchInitialData();
  }, [token, onboardingCompleted]);

  // Helper to generate today's initial tasks based on timetable
  function generateTodayData(dateStr, currentTimetable) {
    const dateObj = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];
    
    const rawClasses = currentTimetable[dayName];
    const todaysClasses = Array.isArray(rawClasses) ? rawClasses : [];
    
    const todayStr = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    // If it's NOT today (past or future date that isn't saved in the DB), 
    // do not populate default daily tasks, but keep the classes for the timetable view.
    if (dateStr !== todayStr) {
      return {
        date: dateStr,
        dayName: dayName,
        classes: todaysClasses,
        tasks: {}
      };
    }

    // Generate Academic tasks dynamically from today's classes
    const academicTasks = todaysClasses.map((cls, index) => {
      const subject = subjects.find(s => s.name === cls.subject) || initialSubjects.find(s => s.name === cls.subject);
      const isProblemSet = index % 2 !== 0; 
      
      return {
        id: `acad_${index}`,
        subjectId: subject ? subject.id : null,
        name: `${cls.subject} — ${isProblemSet ? 'Problems' : 'Lecture Revision'}`,
        targetMinutes: 45,
        completed: false,
        output: ''
      };
    });

    return {
      date: dateStr,
      dayName: dayName,
      classes: todaysClasses,
      tasks: {
        Academic: academicTasks,
        Technical: JSON.parse(JSON.stringify(defaultTasks.Technical)),
        Reading: JSON.parse(JSON.stringify(defaultTasks.Reading)),
        Review: JSON.parse(JSON.stringify(defaultTasks.Review))
      }
    };
  }

  // Resolves a day's data by taking the saved/generated data and injecting any active plans
  const getResolvedDayData = (dateStr, recordsState) => {
    const baseData = recordsState[dateStr] || generateTodayData(dateStr, timetable);
    
    // Deep clone to avoid mutating state directly
    const resolvedData = { 
      ...baseData, 
      tasks: { ...baseData.tasks } 
    };

    studyPlans.forEach(plan => {
      if (plan.isActive && dateStr >= plan.startDate && dateStr <= plan.endDate) {
        const subject = subjects.find(s => s.id === plan.subjectId);
        if (subject) {
          const category = subject.category;
          const taskId = `plan_${plan.id}_${dateStr}`;
          
          if (!resolvedData.tasks[category]) {
            resolvedData.tasks[category] = [];
          }
          
          // Only inject if it doesn't already exist (in case it was already saved to DB with completed=true)
          const exists = resolvedData.tasks[category].find(t => t.id === taskId);
          if (!exists) {
            resolvedData.tasks[category] = [
              ...resolvedData.tasks[category],
              {
                id: taskId,
                subjectId: subject.id,
                name: `${subject.name} (Plan)`,
                targetMinutes: plan.targetMinutes,
                completed: false,
                output: ''
              }
            ];
          }
        }
      }
    });

    return resolvedData;
  };

  const todayData = getResolvedDayData(selectedDate, dailyRecords);

  const syncDailyRecord = async (dateStr, data) => {
    await apiFetch('/daily_records', 'POST', {
      date: dateStr,
      day_name: data.dayName,
      classes: data.classes,
      tasks: data.tasks
    });
  };

  const updateTask = (category, taskId, updates) => {
    setDailyRecords(prev => {
      const currentDayData = getResolvedDayData(selectedDate, prev);
      const newTasks = { ...currentDayData.tasks };
      newTasks[category] = newTasks[category].map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      );
      const updatedDayData = { ...currentDayData, tasks: newTasks };
      
      syncDailyRecord(selectedDate, updatedDayData);
      return { ...prev, [selectedDate]: updatedDayData };
    });
  };

  const addTask = (category, newTask) => {
    setDailyRecords(prev => {
      const currentDayData = getResolvedDayData(selectedDate, prev);
      const newTasks = { ...currentDayData.tasks };
      newTasks[category] = [...(newTasks[category] || []), {
        id: `custom_${Date.now()}`,
        completed: false,
        output: '',
        ...newTask
      }];
      const updatedDayData = { ...currentDayData, tasks: newTasks };
      
      syncDailyRecord(selectedDate, updatedDayData);
      return { ...prev, [selectedDate]: updatedDayData };
    });
  };

  const deleteTask = (category, taskId) => {
    setDailyRecords(prev => {
      const currentDayData = getResolvedDayData(selectedDate, prev);
      const newTasks = { ...currentDayData.tasks };
      newTasks[category] = newTasks[category].filter(t => t.id !== taskId);
      const updatedDayData = { ...currentDayData, tasks: newTasks };
      
      syncDailyRecord(selectedDate, updatedDayData);
      return { ...prev, [selectedDate]: updatedDayData };
    });
  };

  const addSubject = async (newSubject) => {
    const subject = { id: `sub_${Date.now()}`, progress: 0, currentTopic: '', ...newSubject };
    setSubjects(prev => [...prev, subject]);
    
    await apiFetch('/subjects', 'POST', {
      id: subject.id,
      name: subject.name,
      type: subject.type,
      category: subject.category,
      progress: subject.progress,
      current_topic: subject.currentTopic
    });
  };

  const updateSubject = async (id, updates) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    
    const dbUpdates = { ...updates };
    if (dbUpdates.currentTopic !== undefined) {
      dbUpdates.current_topic = dbUpdates.currentTopic;
      delete dbUpdates.currentTopic;
    }
    
    await apiFetch(`/subjects/${id}`, 'PATCH', dbUpdates);
  };

  const deleteSubject = async (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    await apiFetch(`/subjects/${id}`, 'DELETE');
  };

  const addSubjectCategory = async (newCategory) => {
    const cat = { id: `cat_${Date.now()}`, ...newCategory };
    setSubjectCategories(prev => [...prev, cat]);
    
    await apiFetch('/categories', 'POST', {
      id: cat.id,
      title: cat.title,
      category: cat.category,
      default_type: cat.defaultType
    });
  };

  const deleteSubjectCategory = async (id) => {
    console.log("DELETING CATEGORY WITH ID:", id);
    console.log("Current Subject Categories:", subjectCategories);
    setSubjectCategories(prev => {
      const filtered = prev.filter(c => c.id !== id);
      console.log("New Subject Categories after filter:", filtered);
      return filtered;
    });
    try {
      await apiFetch(`/categories/${id}`, 'DELETE');
      console.log("API Fetch successful for delete");
    } catch(e) {
      console.error("API Fetch failed for delete", e);
    }
  };

  const addStudyPlan = async (subjectId, startDateStr, endDateStr, targetMinutes) => {
    const newPlan = {
      id: `plan_${Date.now()}`,
      subjectId,
      startDate: startDateStr,
      endDate: endDateStr,
      targetMinutes: Number(targetMinutes),
      isActive: true
    };

    setStudyPlans(prev => [...prev, newPlan]);

    await apiFetch('/study_plans', 'POST', {
      id: newPlan.id,
      subject_id: newPlan.subjectId,
      start_date: newPlan.startDate,
      end_date: newPlan.endDate,
      target_minutes: newPlan.targetMinutes,
      is_active: newPlan.isActive
    });
  };

  const updateStudyPlan = async (id, updates) => {
    setStudyPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    const dbUpdates = {};
    if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.targetMinutes !== undefined) dbUpdates.target_minutes = updates.targetMinutes;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    await apiFetch(`/study_plans/${id}`, 'PATCH', dbUpdates);
  };

  const deleteStudyPlan = async (id) => {
    setStudyPlans(prev => prev.filter(p => p.id !== id));
    await apiFetch(`/study_plans/${id}`, 'DELETE');
  };

  const saveWeeklyReview = async (weekStartDate, reviewData) => {
    setWeeklyReviews(prev => ({
      ...prev,
      [weekStartDate]: { weekStartDate, ...reviewData }
    }));
    
    await apiFetch('/weekly_reviews', 'POST', {
      week_start_date: weekStartDate,
      best_achievement: reviewData.bestAchievement,
      biggest_problem: reviewData.biggestProblem,
      next_priority: reviewData.nextPriority
    });
  };

  const updateTimetableDay = async (dayName, classesArray) => {
    setTimetable(prev => ({
      ...prev,
      [dayName]: classesArray
    }));
    
    await apiFetch('/weekly_timetable', 'POST', {
      day_name: dayName,
      classes: classesArray
    });
  };

  const calculateScore = () => {
    const baseWeightages = {
      Academic: 0.30,
      Technical: 0.50,
      Reading: 0.10,
      Review: 0.10
    };
    const customWeight = 0.10;

    let totalWeight = 0;
    let earnedScore = 0;
    
    Object.keys(todayData.tasks).forEach(category => {
      const tasks = todayData.tasks[category] || [];
      if (tasks.length > 0) {
        const weight = baseWeightages[category] || customWeight;
        totalWeight += weight;
        
        const completedCount = tasks.filter(t => t.completed).length;
        const categoryScore = (completedCount / tasks.length) * 100 * weight;
        earnedScore += categoryScore;
      }
    });

    if (totalWeight === 0) return 0;
    return Math.round(earnedScore / totalWeight);
  };

  const calculateHours = () => {
    let totalTarget = 0;
    let totalCompleted = 0;

    Object.values(todayData.tasks).forEach(categoryTasks => {
      categoryTasks.forEach(t => {
        const mins = Number(t.targetMinutes) || 0;
        totalTarget += mins;
        if (t.completed) totalCompleted += mins;
      });
    });

    return { target: totalTarget, completed: totalCompleted };
  };

  if (authLoading || (token && onboardingCompleted && isInitializing)) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        Loading tracker data...
      </div>
    );
  }

  // Do not render tracker if not authenticated or not onboarded.
  // The Login page or Onboarding page will render instead from main.jsx/App.jsx.
  // Wait, we need AppProvider to pass down children so App.jsx can render them!
  if (!token || !onboardingCompleted) {
    return <>{children}</>;
  }

  return (
    <AppContext.Provider value={{
      subjects,
      setSubjects,
      timetable,
      selectedDate,
      setSelectedDate,
      todayData,
      dailyRecords,
      subjectCategories,
      studyPlans,
      weeklyReviews,
      updateTask,
      addTask,
      deleteTask,
      addSubject,
      updateSubject,
      deleteSubject,
      addSubjectCategory,
      deleteSubjectCategory,
      addStudyPlan,
      updateStudyPlan,
      deleteStudyPlan,
      saveWeeklyReview,
      updateTimetableDay,
      calculateScore,
      calculateHours,
      getResolvedDayData
    }}>
      {children}
    </AppContext.Provider>
  );
};
