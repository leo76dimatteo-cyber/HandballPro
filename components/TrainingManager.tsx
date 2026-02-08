
import React, { useState, useEffect, useMemo } from 'react';
import { TrainingSession, TrainingEvaluation, TeamProfile, HandballRole, Player, UserRole, Exercise } from '../types';
import { storage } from '../services/storageService';
import TacticalBoard from './TacticalBoard';
import ExerciseLibrary from './ExerciseLibrary';
import { Dumbbell, Plus, Trash2, CheckCircle2, XCircle, Star, TrendingUp, Calendar, ChevronRight, Save, Layers, User, Shield, Info, ArrowLeft, MoreHorizontal, Check, X, Users, UserCheck, Search, Filter, Layout, BookOpen, Zap, Activity, ChevronLeft } from 'lucide-react';

const ALL_ROLES = Object.values(HandballRole).filter(r => r !== HandballRole.ND);

interface TrainingManagerProps {
  onBack: () => void;
  onNavigateToSettings?: () => void;
  role?: UserRole;
  t: any;
}

const TrainingManager: React.FC<TrainingManagerProps> = ({ onBack, onNavigateToSettings, role = UserRole.ADMIN, t }) => {
  const [activeTab, setActiveTab] = useState<'SESSIONS' | 'TACTICAL' | 'EXERCISES'>('SESSIONS');
  const [sessions, setSessions] = useState<TrainingSession[]>(() => storage.getTrainings());
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isReadOnly = role === UserRole.GUEST;
  
  const [newSessionData, setNewSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

  const registries = storage.getAllRegistries();

  const handleCreateSession = () => {
    if (isReadOnly) return;
    if (!newSessionData.category) {
      alert("Select category");
      return;
    }

    const registry = storage.getRegistryByCategory(newSessionData.category);
    if (!registry || !registry.players || registry.players.length === 0) {
      alert(`Warning: No players found for ${newSessionData.category}. Add them in Registry.`);
      return;
    }

    const evaluations: TrainingEvaluation[] = registry.players.map(p => ({
      playerId: p.id,
      playerName: `${p.lastName} ${p.firstName}`,
      isPresent: true,
      role: (p.roles && p.roles.length > 0) ? p.roles[0] : HandballRole.ND,
      rating: 3,
      notes: '',
      assignedExercises: []
    }));

    const newSession: TrainingSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: newSessionData.date,
      category: newSessionData.category,
      evaluations,
      exercises: []
    };

    setActiveSession(newSession);
    setShowAddModal(false);
    setActiveTab('SESSIONS');
  };

  const handleSaveSession = () => {
    if (isReadOnly) return;
    if (activeSession) {
      storage.saveTraining(activeSession);
      setSessions(storage.getTrainings());
      setActiveSession(null);
      alert(t.saveSession + " success!");
    }
  };

  const handleDeleteSession = (id: string) => {
    if (isReadOnly) return;
    if (window.confirm("Delete training session?")) {
      storage.deleteTraining(id);
      setSessions(storage.getTrainings());
    }
  };

  const handleToggleAll = (present: boolean) => {
    if (isReadOnly || !activeSession) return;
    const newEvals = activeSession.evaluations.map(e => ({ ...e, isPresent: present }));
    setActiveSession({ ...activeSession, evaluations: newEvals });
  };

  const updateEval = (playerId: string, updates: Partial<TrainingEvaluation>) => {
    if (isReadOnly || !activeSession) return;
    const newEvals = activeSession.evaluations.map(e => 
      e.playerId === playerId ? { ...e, ...updates } : e
    );
    setActiveSession({ ...activeSession, evaluations: newEvals });
  };

  const handleAssignExercise = (ex: Exercise, target: 'ALL' | string) => {
    if (!activeSession) return;
    if (target === 'ALL') {
      const current = activeSession.exercises || [];
      if (current.find(e => e.id === ex.id)) {
        alert("Esercizio già presente nel piano di squadra.");
        return;
      }
      setActiveSession({ ...activeSession, exercises: [...current, ex] });
    } else {
      const newEvals = activeSession.evaluations.map(ev => {
        if (ev.playerId === target) {
          const current = ev.assignedExercises || [];
          if (current.find(e => e.id === ex.id)) {
            alert("Esercizio già presente per questo atleta.");
            return ev;
          }
          return { ...ev, assignedExercises: [...current, ex] };
        }
        return ev;
      });
      setActiveSession({ ...activeSession, evaluations: newEvals });
    }
  };

  const removeExerciseFromTeam = (id: string) => {
    if (!activeSession) return;
    setActiveSession({
        ...activeSession,
        exercises: (activeSession.exercises || []).filter(e => e.id !== id)
    });
  };

  const removeExerciseFromPlayer = (playerId: string, exId: string) => {
    if (!activeSession) return;
    const newEvals = activeSession.evaluations.map(ev => {
      if (ev.playerId === playerId) {
        return { ...ev, assignedExercises: (ev.assignedExercises || []).filter(e => e.id !== exId) };
      }
      return ev;
    });
    setActiveSession({ ...activeSession, evaluations: newEvals });
  };

  const filteredEvaluations = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.evaluations.filter(ev => 
      ev.playerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSession, searchQuery]);

  const playerOptions = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.evaluations.map(ev => ({ id: ev.playerId, name: ev.playerName }));
  }, [activeSession]);

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 animate-in fade-in duration-500 pb-20">
      {/* HEADER PRINCIPALE */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-emerald-600 p-5 rounded-[2rem] text-white shadow-2xl shadow-emerald-100"><Dumbbell size={36} /></div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">{t.trainingLab}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t.registry} & {t.exerciseLib}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {activeTab === 'EXERCISES' && activeSession && (
             <button 
               onClick={() => setActiveTab('SESSIONS')}
               className="flex items-center gap-2 px-6 py-4 bg-emerald-100 text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-200 transition-all shadow-sm"
             >
               <ChevronLeft size={16} /> Torna all'Appello
             </button>
           )}
           <button onClick={onBack} className="p-5 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100"><ArrowLeft size={24} /></button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-12 w-full md:w-fit overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('SESSIONS')} className={`shrink-0 px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'SESSIONS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><Calendar size={16} /> {t.trainingRegistry}</button>
        <button onClick={() => setActiveTab('EXERCISES')} className={`shrink-0 px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'EXERCISES' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><BookOpen size={16} /> {t.exerciseLib}</button>
        <button onClick={() => setActiveTab('TACTICAL')} className={`shrink-0 px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'TACTICAL' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><Layout size={16} /> {t.tacticalBoard}</button>
      </div>

      {/* CONTENUTO TAB SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <>
          {activeSession ? (
            /* VISTA VALUTAZIONE SESSIONE ATTIVA */
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-blue-50 p-6 md:p-8 rounded-[2.5rem] border border-blue-100 gap-4">
                  <div>
                    <h3 className="text-xl font-black text-blue-900 uppercase">{t.attendanceRating}</h3>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{activeSession.category} • {activeSession.date}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveSession(null)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-400 bg-white border border-slate-100 hover:bg-slate-50">{t.exit}</button>
                    {!isReadOnly && (
                      <button onClick={handleSaveSession} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                        <Save size={16} /> {t.saveSession}
                      </button>
                    )}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Elenco Atleti */}
                  <div className="lg:col-span-8 space-y-6">
                    {!isReadOnly && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-7">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text"
                                placeholder={t.searchPlayer}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                              />
                            </div>
                        </div>
                        <div className="md:col-span-5 flex gap-2">
                            <button onClick={() => handleToggleAll(true)} className="flex-1 bg-white border border-emerald-200 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-colors">{t.allPresent}</button>
                            <button onClick={() => handleToggleAll(false)} className="flex-1 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors">{t.allAbsent}</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {filteredEvaluations.map((ev) => (
                        <div key={ev.playerId} className={`bg-white rounded-[2rem] border transition-all ${ev.isPresent ? 'border-emerald-100 shadow-sm' : 'border-slate-100 opacity-60 bg-slate-50/50'}`}>
                          <div className="p-4 md:p-6 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                              <button 
                                onClick={() => !isReadOnly && updateEval(ev.playerId, { isPresent: !ev.isPresent })}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md ${ev.isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                              >
                                {ev.isPresent ? <CheckCircle2 size={28} /> : <X size={28} />}
                              </button>
                              <div>
                                <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none mb-1">{ev.playerName}</h4>
                              </div>
                            </div>

                            {ev.isPresent && (
                              <div className="flex-[3] space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.focusRoleToday}</label>
                                    <select 
                                      disabled={isReadOnly}
                                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
                                      value={ev.role}
                                      onChange={(e) => updateEval(ev.playerId, { role: e.target.value as HandballRole })}
                                    >
                                      <option value={ev.role as string}>{ev.role as string}</option>
                                      {!isReadOnly && ALL_ROLES.filter(r => r !== ev.role).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">{t.performance}</label>
                                    <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                          key={star} 
                                          disabled={isReadOnly}
                                          onClick={() => updateEval(ev.playerId, { rating: star })}
                                          className={`transition-colors ${ev.rating >= star ? 'text-amber-400' : 'text-slate-200'} disabled:cursor-default`}
                                        >
                                          <Star size={20} fill={ev.rating >= star ? "currentColor" : "none"} />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.techNotes}</label>
                                    <input 
                                      disabled={isReadOnly}
                                      type="text" 
                                      placeholder={isReadOnly ? "No notes" : "Details..."}
                                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-[10px] outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent"
                                      value={ev.notes}
                                      onChange={(e) => updateEval(ev.playerId, { notes: e.target.value })}
                                    />
                                  </div>
                                </div>

                                {/* Piano Personale Atleta */}
                                <div className="pt-2 border-t border-slate-100">
                                   <div className="flex items-center justify-between mb-2">
                                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Zap size={10} className="text-blue-500" /> {t.personalWorkout}</label>
                                      {!isReadOnly && (
                                        <button 
                                          onClick={() => setActiveTab('EXERCISES')} 
                                          className="text-blue-600 text-[8px] font-black uppercase hover:underline flex items-center gap-1"
                                        >
                                          <Plus size={10} /> {t.add}
                                        </button>
                                      )}
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                      {(!ev.assignedExercises || ev.assignedExercises.length === 0) ? (
                                        <span className="text-[8px] italic text-slate-300 uppercase">Nessun obiettivo individuale</span>
                                      ) : (
                                        ev.assignedExercises.map(ex => (
                                          <div key={ex.id} className="bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg flex items-center gap-2 group/ex">
                                             <span className="text-[8px] font-black text-blue-700 uppercase">{ex.name} <span className="opacity-50">({ex.sets}x{ex.reps})</span></span>
                                             {!isReadOnly && <button onClick={() => removeExerciseFromPlayer(ev.playerId, ex.id)} className="text-blue-300 hover:text-red-500 transition-colors"><X size={10} /></button>}
                                          </div>
                                        ))
                                      )}
                                   </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Piano Squadra (Sidebar) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col sticky top-24">
                       <div className="bg-blue-600 p-6 flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                             <Users size={20} />
                             <h3 className="font-black uppercase tracking-widest text-[10px]">Piano Squadra (Tutti)</h3>
                          </div>
                          <button onClick={() => setActiveTab('EXERCISES')} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors"><Plus size={16} /></button>
                       </div>
                       <div className="p-6 space-y-4">
                          {(!activeSession.exercises || activeSession.exercises.length === 0) ? (
                            <div className="py-12 text-center flex flex-col items-center gap-3">
                               <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Layers size={24} /></div>
                               <p className="text-[10px] font-black text-slate-300 uppercase">Nessun esercizio pianificato per tutti</p>
                               <button onClick={() => setActiveTab('EXERCISES')} className="text-blue-600 font-black text-[9px] uppercase hover:underline">Sfoglia Libreria</button>
                            </div>
                          ) : (
                            activeSession.exercises.map(ex => (
                              <div key={ex.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                 <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-800 uppercase truncate leading-none mb-1">{ex.name}</p>
                                    <div className="flex items-center gap-3">
                                       <span className="text-[8px] font-bold text-blue-600 uppercase">{ex.sets} Sets</span>
                                       <span className="text-[8px] font-bold text-slate-400 uppercase">{ex.reps} Reps</span>
                                    </div>
                                 </div>
                                 <button onClick={() => removeExerciseFromTeam(ex.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={14} /></button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            /* ELENCO SESSIONI ARCHIVIATE */
            <div className="space-y-8">
               {!isReadOnly && (
                 <div className="flex justify-end">
                   <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 transition-all flex items-center gap-3 active:scale-95"><Plus size={24} /> {t.newSession}</button>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {sessions.length === 0 ? (
                   <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6"><Dumbbell size={64} className="text-slate-100" /><div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No session archived</h3></div></div>
                 ) : (
                   sessions.map((s) => (
                     <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl transition-all flex flex-col">
                       <div className="bg-slate-900 p-8 flex items-center justify-between text-white"><div className="min-w-0"><h4 className="text-xl font-black uppercase truncate leading-none">{s.category}</h4></div><div className="bg-white/10 p-4 rounded-2xl"><Calendar size={20} /></div></div>
                       <div className="p-8 space-y-8 flex-1">
                          <div className="flex items-center justify-between">
                             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p><span className="text-base font-black text-slate-800">{s.date}</span></div>
                             <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.meanRating}</p><div className="flex items-center gap-2 justify-end"><TrendingUp size={16} className="text-emerald-500" /><span className="text-2xl font-black text-emerald-600">{(s.evaluations.filter(e => e.isPresent).reduce((a,b) => a + b.rating, 0) / (s.evaluations.filter(e => e.isPresent).length || 1)).toFixed(1)}</span></div></div>
                          </div>
                          <div className="flex items-center justify-between pt-8 border-t border-slate-50"><div className="flex items-center gap-3"><div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">{s.evaluations.filter(e => e.isPresent).length} {t.presentCount}</div>{s.exercises && s.exercises.length > 0 && (<div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">{s.exercises.length} Team Plan</div>)}</div><div className="flex items-center gap-2">{!isReadOnly && <button onClick={() => handleDeleteSession(s.id)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors"><Trash2 size={20} /></button>}<button onClick={() => { setActiveSession(s); setActiveTab('SESSIONS'); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95"><ChevronRight size={24} /></button></div></div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </>
      )}

      {/* CONTENUTO Altre Tab */}
      {activeTab === 'TACTICAL' && <TacticalBoard t={t} />}

      {activeTab === 'EXERCISES' && (
        <ExerciseLibrary 
          t={t} 
          onAssign={activeSession ? handleAssignExercise : undefined} 
          playerOptions={playerOptions}
        />
      )}

      {/* MODALE NUOVA SESSIONE */}
      {!isReadOnly && showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
                 <div><h3 className="font-black uppercase tracking-tight text-2xl">{t.newSession}</h3></div>
                 <button onClick={() => setShowAddModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={28} /></button>
              </div>
              <div className="p-8 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Layers size={16} className="text-emerald-500" /> {t.category}</label>
                    <select className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700 uppercase" value={newSessionData.category} onChange={e => setNewSessionData({...newSessionData, category: e.target.value})}>
                      <option value="">{t.selectTeamCat}...</option>
                      {registries.map(r => (<option key={r.category} value={r.category}>{r.category.toUpperCase()} ({r.players.length} {t.athletes})</option>))}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Calendar size={16} className="text-emerald-500" /> Date</label>
                    <input type="date" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newSessionData.date} onChange={e => setNewSessionData({...newSessionData, date: e.target.value})} />
                 </div>
                 <div className="pt-4 flex gap-4">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100">{t.decline}</button>
                    <button onClick={handleCreateSession} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"><UserCheck size={20} /> {t.kickOff}</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManager;
