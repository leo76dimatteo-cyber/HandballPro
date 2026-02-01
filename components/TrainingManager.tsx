
import React, { useState, useEffect } from 'react';
import { TrainingSession, TrainingEvaluation, TeamProfile, HandballRole, Player } from '../types';
import { storage } from '../services/storageService';
import { Dumbbell, Plus, Trash2, CheckCircle2, XCircle, Star, TrendingUp, Calendar, ChevronRight, Save, Layers, User, Shield, Info, ArrowLeft, MoreHorizontal, Check, X } from 'lucide-react';

const ROLES = Object.values(HandballRole);

const TrainingManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessions, setSessions] = useState<TrainingSession[]>(() => storage.getTrainings());
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

  const registries = storage.getAllRegistries();

  const handleCreateSession = () => {
    if (!newSessionData.category) {
      alert("Seleziona una categoria");
      return;
    }

    const registry = storage.getRegistryByCategory(newSessionData.category);
    if (!registry) {
      alert("Nessun roster trovato per questa categoria. Crealo prima nelle impostazioni.");
      return;
    }

    const evaluations: TrainingEvaluation[] = registry.players.map(p => ({
      playerId: p.id,
      playerName: `${p.lastName} ${p.firstName}`,
      isPresent: true,
      role: HandballRole.ND,
      rating: 3,
      notes: ''
    }));

    const newSession: TrainingSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: newSessionData.date,
      category: newSessionData.category,
      evaluations
    };

    setActiveSession(newSession);
    setShowAddModal(false);
  };

  const handleSaveSession = () => {
    if (activeSession) {
      storage.saveTraining(activeSession);
      setSessions(storage.getTrainings());
      setActiveSession(null);
    }
  };

  const handleDeleteSession = (id: string) => {
    if (confirm("Eliminare definitivamente questa sessione di allenamento?")) {
      storage.deleteTraining(id);
      setSessions(storage.getTrainings());
    }
  };

  const updateEval = (playerId: string, updates: Partial<TrainingEvaluation>) => {
    if (!activeSession) return;
    const newEvals = activeSession.evaluations.map(e => 
      e.playerId === playerId ? { ...e, ...updates } : e
    );
    setActiveSession({ ...activeSession, evaluations: newEvals });
  };

  const calculateAverage = (session: TrainingSession) => {
    const present = session.evaluations.filter(e => e.isPresent);
    if (present.length === 0) return 0;
    const sum = present.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / present.length).toFixed(1);
  };

  if (activeSession) {
    return (
      <div className="max-w-5xl mx-auto py-6 md:py-8 px-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><Dumbbell size={24} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sessione Training</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeSession.category} • {new Date(activeSession.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setActiveSession(null)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100">Annulla</button>
             <button onClick={handleSaveSession} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                <Save size={16} /> Salva Sessione
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeSession.evaluations.map((ev) => (
            <div key={ev.playerId} className={`bg-white p-5 rounded-[2rem] border transition-all ${ev.isPresent ? 'border-slate-200' : 'border-slate-100 opacity-60 bg-slate-50/50'}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button 
                    onClick={() => updateEval(ev.playerId, { isPresent: !ev.isPresent })}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${ev.isPresent ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'}`}
                  >
                    {ev.isPresent ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  </button>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight truncate">{ev.playerName}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ev.isPresent ? 'Presente' : 'Assente'}</p>
                  </div>
                </div>

                {ev.isPresent && (
                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-48">
                      <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block ml-1">Ruolo Sessione</label>
                      <select 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                        value={ev.role}
                        onChange={(e) => updateEval(ev.playerId, { role: e.target.value as HandballRole })}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block ml-1">Valutazione</label>
                      <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => updateEval(ev.playerId, { rating: star })}
                            className={`transition-colors ${ev.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                          >
                            <Star size={18} fill={ev.rating >= star ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 md:w-64">
                       <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block ml-1">Note Tecniche</label>
                       <input 
                         type="text" 
                         placeholder="Es: Ottimo tiro in elevazione"
                         className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-[10px] outline-none"
                         value={ev.notes}
                         onChange={(e) => updateEval(ev.playerId, { notes: e.target.value })}
                       />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Training Lab</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Pianificazione & Scouting Tecnico</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100"><ArrowLeft size={20} /></button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus size={20} /> Nuova Sessione
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200">
            <Dumbbell size={56} />
          </div>
          <div>
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nessuna Sessione</h3>
             <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mt-1">Crea la tua prima sessione di allenamento per tracciare i miglioramenti.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
              <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
                <div>
                   <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Allenamento</p>
                   <h4 className="text-lg font-black uppercase truncate">{s.category}</h4>
                </div>
                <div className="bg-white/10 p-3 rounded-xl"><Calendar size={18} /></div>
              </div>
              <div className="p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                       <span className="text-sm font-black text-slate-800">{new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Media Team</span>
                       <div className="flex items-center gap-1.5 justify-end">
                          <TrendingUp size={14} className="text-emerald-500" />
                          <span className="text-xl font-black text-emerald-600">{calculateAverage(s)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex -space-x-3 overflow-hidden">
                       {s.evaluations.slice(0, 5).map((ev, i) => (
                         <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black uppercase text-white ${ev.isPresent ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            {ev.playerName[0]}
                         </div>
                       ))}
                       {s.evaluations.length > 5 && <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">+{s.evaluations.length - 5}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleDeleteSession(s.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                       <button onClick={() => setActiveSession(s)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={18} /></button>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUOVA SESSIONE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
                 <div>
                    <h3 className="font-black uppercase tracking-tight text-xl">Nuova Sessione</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Inizializza un nuovo allenamento</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Layers size={14} className="text-emerald-500" /> Categoria Squadra
                    </label>
                    <select 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700 uppercase"
                       value={newSessionData.category}
                       onChange={e => setNewSessionData({...newSessionData, category: e.target.value})}
                    >
                       <option value="">Seleziona...</option>
                       {registries.map(r => <option key={r.category} value={r.category}>{r.category}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Calendar size={14} className="text-emerald-500" /> Data Allenamento
                    </label>
                    <input 
                       type="date"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700"
                       value={newSessionData.date}
                       onChange={e => setNewSessionData({...newSessionData, date: e.target.value})}
                    />
                 </div>
                 <div className="pt-4 flex gap-4">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100">Annulla</button>
                    <button onClick={handleCreateSession} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                       <Check size={18} /> Inizia Appello
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManager;
