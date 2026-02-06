
import React, { useState, useEffect, useMemo } from 'react';
import { TrainingSession, TrainingEvaluation, TeamProfile, HandballRole, Player, UserRole } from '../types';
import { storage } from '../services/storageService';
import TacticalBoard from './TacticalBoard';
import { Dumbbell, Plus, Trash2, CheckCircle2, XCircle, Star, TrendingUp, Calendar, ChevronRight, Save, Layers, User, Shield, Info, ArrowLeft, MoreHorizontal, Check, X, Users, UserCheck, Search, Filter, Layout } from 'lucide-react';

const ALL_ROLES = Object.values(HandballRole).filter(r => r !== HandballRole.ND);

interface TrainingManagerProps {
  onBack: () => void;
  onNavigateToSettings?: () => void;
  role?: UserRole;
}

const TrainingManager: React.FC<TrainingManagerProps> = ({ onBack, onNavigateToSettings, role = UserRole.ADMIN }) => {
  const [activeTab, setActiveTab] = useState<'SESSIONS' | 'TACTICAL'>('SESSIONS');
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
      alert("Seleziona una categoria");
      return;
    }

    const registry = storage.getRegistryByCategory(newSessionData.category);
    if (!registry || !registry.players || registry.players.length === 0) {
      alert(`Attenzione: Non ci sono giocatori registrati per la categoria ${newSessionData.category}. Aggiungili prima nell'Anagrafica.`);
      return;
    }

    const evaluations: TrainingEvaluation[] = registry.players.map(p => ({
      playerId: p.id,
      playerName: `${p.lastName} ${p.firstName}`,
      isPresent: true,
      role: (p.roles && p.roles.length > 0) ? p.roles[0] : HandballRole.ND,
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
    if (isReadOnly) return;
    if (activeSession) {
      storage.saveTraining(activeSession);
      setSessions(storage.getTrainings());
      setActiveSession(null);
      alert("Allenamento salvato con successo!");
    }
  };

  const handleDeleteSession = (id: string) => {
    if (isReadOnly) return;
    if (window.confirm("Sei sicuro di voler eliminare questa sessione di allenamento?")) {
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

  const getRegistryPlayer = (playerId: string) => {
    if (!activeSession) return null;
    const registry = storage.getRegistryByCategory(activeSession.category);
    return registry?.players.find(p => p.id === playerId);
  };

  const filteredEvaluations = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.evaluations.filter(ev => 
      ev.playerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSession, searchQuery]);

  if (activeSession) {
    return (
      <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl"><Dumbbell size={28} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Appello & Valutazione</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeSession.category} • {new Date(activeSession.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setActiveSession(null)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100">Esci</button>
             {!isReadOnly && (
               <button onClick={handleSaveSession} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                  <Save size={16} /> Salva Sessione
               </button>
             )}
          </div>
        </div>

        {!isReadOnly && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
             <div className="md:col-span-8">
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text"
                     placeholder="Cerca atleta..."
                     className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>
             <div className="md:col-span-4 flex gap-2">
                <button onClick={() => handleToggleAll(true)} className="flex-1 bg-white border border-emerald-200 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-colors">Tutti Presenti</button>
                <button onClick={() => handleToggleAll(false)} className="flex-1 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors">Tutti Assenti</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-8">
          {filteredEvaluations.map((ev) => {
            const registryPlayer = getRegistryPlayer(ev.playerId);
            return (
              <div key={ev.playerId} className={`bg-white rounded-[2rem] border transition-all ${ev.isPresent ? 'border-emerald-100 shadow-sm' : 'border-slate-100 opacity-60 bg-slate-50/50'}`}>
                <div className="p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => !isReadOnly && updateEval(ev.playerId, { isPresent: !ev.isPresent })}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md ${ev.isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {ev.isPresent ? <CheckCircle2 size={28} /> : <X size={28} />}
                    </button>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none mb-1">{ev.playerName}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {registryPlayer?.roles?.map(r => (
                          <span key={r} className="text-[7px] font-black uppercase bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {ev.isPresent && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-[2]">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Focus Ruolo Oggi</label>
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
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Performance</label>
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
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Note Tecniche</label>
                         <input 
                           disabled={isReadOnly}
                           type="text" 
                           placeholder={isReadOnly ? "Nessuna nota" : "Dettagli allenamento..."}
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-[10px] outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent"
                           value={ev.notes}
                           onChange={(e) => updateEval(ev.playerId, { notes: e.target.value })}
                         />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><Info size={24} /></div>
           <div>
              <h4 className="font-black text-emerald-900 uppercase tracking-tight text-sm">Guida alla Valutazione</h4>
              <p className="text-[11px] text-emerald-700 font-medium leading-relaxed mt-1">
                 1. <strong>Appello:</strong> clicca sull'icona a sinistra per segnare presente/assente l'atleta. 2. <strong>Ruolo:</strong> definisci su quale aspetto tecnico ha lavorato oggi (es. Pivot). 3. <strong>Stelle:</strong> valuta l'impegno e la qualità dell'esecuzione tecnica (da 1 a 5). 4. <strong>Note:</strong> aggiungi commenti specifici (es. "ottima tenuta difensiva") che rimarranno nello storico.
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-emerald-600 p-5 rounded-[2rem] text-white shadow-2xl shadow-emerald-100"><Dumbbell size={36} /></div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Training Lab</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gestione Registro e Schemi Tattici</p>
          </div>
        </div>
        <button onClick={onBack} className="p-5 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100"><ArrowLeft size={24} /></button>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-12 w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('SESSIONS')}
          className={`flex-1 md:flex-none px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'SESSIONS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar size={16} /> Registro Allenamenti
        </button>
        <button 
          onClick={() => setActiveTab('TACTICAL')}
          className={`flex-1 md:flex-none px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'TACTICAL' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Layout size={16} /> Lavagna Tattica
        </button>
      </div>

      {activeTab === 'SESSIONS' ? (
        <div className="space-y-8">
           {!isReadOnly && (
             <div className="flex justify-end">
               <button 
                 onClick={() => setShowAddModal(true)}
                 className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 transition-all flex items-center gap-3 active:scale-95"
               >
                 <Plus size={24} /> Nuova Sessione
               </button>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {sessions.length === 0 ? (
               <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6">
                 <Dumbbell size={64} className="text-slate-100" />
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nessuna Sessione Archiviata</h3>
                    <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mt-2">I tuoi allenamenti appariranno qui.</p>
                 </div>
               </div>
             ) : (
               sessions.map((s) => (
                 <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl transition-all flex flex-col">
                   <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
                     <div className="min-w-0">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Allenamento</p>
                        <h4 className="text-xl font-black uppercase truncate leading-none">{s.category}</h4>
                     </div>
                     <div className="bg-white/10 p-4 rounded-2xl"><Calendar size={20} /></div>
                   </div>
                   <div className="p-8 space-y-8 flex-1">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Sessione</p>
                            <span className="text-base font-black text-slate-800">{new Date(s.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Media Rating</p>
                            <div className="flex items-center gap-2 justify-end">
                               <TrendingUp size={16} className="text-emerald-500" />
                               <span className="text-2xl font-black text-emerald-600">
                                  { (s.evaluations.filter(e => e.isPresent).reduce((a,b) => a + b.rating, 0) / (s.evaluations.filter(e => e.isPresent).length || 1)).toFixed(1) }
                               </span>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                         <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                              {s.evaluations.filter(e => e.isPresent).length} Presenti
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {!isReadOnly && <button onClick={() => handleDeleteSession(s.id)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors"><Trash2 size={20} /></button>}
                            <button onClick={() => setActiveSession(s)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95"><ChevronRight size={24} /></button>
                         </div>
                      </div>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      ) : (
        <TacticalBoard />
      )}

      {!isReadOnly && showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
                 <div>
                    <h3 className="font-black uppercase tracking-tight text-2xl">Nuova Sessione</h3>
                    <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest">Inizializzazione registro presenze</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={28} /></button>
              </div>
              <div className="p-8 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Layers size={16} className="text-emerald-500" /> Scegli Categoria Team
                    </label>
                    <select 
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700 uppercase"
                      value={newSessionData.category}
                      onChange={e => setNewSessionData({...newSessionData, category: e.target.value})}
                    >
                      <option value="">Seleziona Squadra...</option>
                      {registries.map(r => (
                        <option key={r.category} value={r.category}>
                          {r.category.toUpperCase()} ({r.players.length} Atleti)
                        </option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Calendar size={16} className="text-emerald-500" /> Giorno Allenamento
                    </label>
                    <input 
                       type="date"
                       className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700"
                       value={newSessionData.date}
                       onChange={e => setNewSessionData({...newSessionData, date: e.target.value})}
                    />
                 </div>
                 <div className="pt-4 flex gap-4">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100">Annulla</button>
                    <button onClick={handleCreateSession} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                       <UserCheck size={20} /> Avvia Registro
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
