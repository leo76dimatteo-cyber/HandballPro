
import React, { useState, useMemo, useEffect } from 'react';
import { Exercise, ExerciseCategory } from '../types';
import { storage } from '../services/storageService';
import { Search, Filter, Dumbbell, Zap, Activity, Info, Pencil, Check, X, Clock, RefreshCw, Plus, UserPlus, Users, Trash2, ChevronDown, Layers } from 'lucide-react';

const PREDEFINED_EXERCISES: Exercise[] = [
  // STRETCHING
  { id: 'st1', name: 'Allungamento Quadricipiti', category: ExerciseCategory.STRETCHING, muscles: ['Quadricipiti'], description: 'In piedi, fletti un ginocchio portando il tallone al gluteo.', sets: 2, reps: '30s', rest: '15s' },
  { id: 'st2', name: 'Allungamento Pettorali', category: ExerciseCategory.STRETCHING, muscles: ['Pettorali', 'Deltoidi'], description: 'Braccio teso contro una parete, ruota il busto lateralmente.', sets: 2, reps: '30s', rest: '15s' },
  { id: 'st3', name: 'Flessione del Busto (Hamstrings)', category: ExerciseCategory.STRETCHING, muscles: ['Bicipiti femorali'], description: 'Gambe tese, prova a toccare le punte dei piedi.', sets: 2, reps: '45s', rest: '15s' },
  { id: 'st4', name: 'Allungamento Adduttori', category: ExerciseCategory.STRETCHING, muscles: ['Adduttori'], description: 'Posizione a rana o farfalla, spingere le ginocchia a terra.', sets: 2, reps: '40s', rest: '15s' },
  { id: 'st5', name: 'Allungamento Lombari', category: ExerciseCategory.STRETCHING, muscles: ['Lombari'], description: 'Sdraiato, porta le ginocchia al petto.', sets: 3, reps: '30s', rest: '10s' },
  
  // STRENGTH
  { id: 'sr1', name: 'Push-ups (Piegamenti)', category: ExerciseCategory.STRENGTH, muscles: ['Pettorali', 'Tricipiti', 'Core'], description: 'Piegamenti sulle braccia a corpo libero.', sets: 3, reps: '15', rest: '60s' },
  { id: 'sr2', name: 'Air Squat', category: ExerciseCategory.STRENGTH, muscles: ['Quadricipiti', 'Glutei'], description: 'Accosciata profonda con peso corporeo.', sets: 4, reps: '20', rest: '60s' },
  { id: 'sr3', name: 'Plank Addominale', category: ExerciseCategory.STRENGTH, muscles: ['Core', 'Addominali'], description: 'Tenuta isometrica sugli avambracci.', sets: 3, reps: '45s', rest: '30s' },
  { id: 'sr4', name: 'Lunges (Affondi)', category: ExerciseCategory.STRENGTH, muscles: ['Gambe', 'Glutei'], description: 'Passo in avanti e fletti ginocchia a 90 gradi.', sets: 3, reps: '12 per gamba', rest: '45s' },
  { id: 'sr5', name: 'Burpees', category: ExerciseCategory.STRENGTH, muscles: ['Full Body'], description: 'Dalla stazione eretta a terra e salto finale.', sets: 3, reps: '10', rest: '90s' },

  // HANDBALL
  { id: 'hb1', name: 'Palleggio dinamico', category: ExerciseCategory.HANDBALL, muscles: ['Coordinazione', 'Avambracci'], description: 'Palleggio continuo con cambi di direzione e mano.', sets: 1, reps: '5 min', rest: '60s' },
  { id: 'hb2', name: 'Tiro in sospensione a vuoto', category: ExerciseCategory.HANDBALL, muscles: ['Spalle', 'Gambe', 'Core'], description: 'Simulazione tecnica del salto e caricamento braccio.', sets: 3, reps: '10 per lato', rest: '45s' },
  { id: 'hb3', name: 'Spostamenti laterali bassi', category: ExerciseCategory.HANDBALL, muscles: ['Gambe', 'Reattività'], description: 'Passi accostati in posizione di difesa.', sets: 5, reps: '30s', rest: '30s' },
  { id: 'hb4', name: 'Reaction Drills', category: ExerciseCategory.HANDBALL, muscles: ['Riflessi', 'Gambe'], description: 'Scatto rapido al segnale visivo o sonoro.', sets: 4, reps: '6 scatti', rest: '60s' },
  { id: 'hb5', name: 'Wall Ball Passing', category: ExerciseCategory.HANDBALL, muscles: ['Braccia', 'Precisione'], description: 'Passaggi rapidi contro una parete a distanze variabili.', sets: 3, reps: '50 passaggi', rest: '30s' },
];

interface ExerciseLibraryProps {
  t: any;
  onAssign?: (ex: Exercise, target: 'ALL' | string) => void;
  playerOptions?: { id: string, name: string }[];
}

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ t, onAssign, playerOptions = [] }) => {
  const [exercises, setExercises] = useState<Exercise[]>(() => [...PREDEFINED_EXERCISES, ...storage.getCustomExercises()]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | 'ALL'>('ALL');
  const [muscleFilter, setMuscleFilter] = useState<string>('ALL');
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Exercise>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEx, setNewEx] = useState<Partial<Exercise>>({
    name: '', category: ExerciseCategory.HANDBALL, muscles: [], description: '', sets: 3, reps: '10', rest: '60s'
  });

  const allMuscles = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach(ex => ex.muscles.forEach(m => set.add(m)));
    return Array.from(set).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || 
                           ex.muscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = categoryFilter === 'ALL' || ex.category === categoryFilter;
      const matchesMuscle = muscleFilter === 'ALL' || ex.muscles.includes(muscleFilter);
      return matchesSearch && matchesCat && matchesMuscle;
    });
  }, [exercises, search, categoryFilter, muscleFilter]);

  const startEdit = (ex: Exercise) => {
    setEditingExId(ex.id);
    setEditValues({ sets: ex.sets, reps: ex.reps, rest: ex.rest });
  };

  const saveEdit = (id: string) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, ...editValues } : ex));
    setEditingExId(null);
  };

  const handleCreate = () => {
    if (!newEx.name || !newEx.description) return;
    const exercise: Exercise = {
      ...newEx as Exercise,
      id: 'custom-' + Math.random().toString(36).substr(2, 9),
      muscles: typeof newEx.muscles === 'string' ? (newEx.muscles as string).split(',').map(s => s.trim()) : newEx.muscles || []
    };
    storage.saveCustomExercise(exercise);
    setExercises(prev => [...prev, exercise]);
    setShowCreateModal(false);
    setNewEx({ name: '', category: ExerciseCategory.HANDBALL, muscles: [], description: '', sets: 3, reps: '10', rest: '60s' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header & Filters */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.exerciseLib}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Database Tecnico & Atletico</p>
           </div>
           <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus size={16} /> {t.newExercise}
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Cerca esercizio..."
               className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
          <div className="md:col-span-3">
             <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 appearance-none"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                >
                  <option value="ALL">Tutte le Categorie</option>
                  {Object.values(ExerciseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
             </div>
          </div>
          <div className="md:col-span-3">
             <div className="relative">
                <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 appearance-none"
                  value={muscleFilter}
                  onChange={e => setMuscleFilter(e.target.value)}
                >
                  <option value="ALL">{t.filterMuscle}</option>
                  {allMuscles.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
             </div>
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(ex => {
          const isEditing = editingExId === ex.id;
          return (
            <div key={ex.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
              <div className={`p-6 ${ex.category === ExerciseCategory.HANDBALL ? 'bg-blue-600' : ex.category === ExerciseCategory.STRENGTH ? 'bg-emerald-600' : 'bg-amber-500'} text-white flex justify-between items-center`}>
                 <div className="bg-white/20 p-2 rounded-xl">
                    {ex.category === ExerciseCategory.HANDBALL ? <Activity size={20} /> : ex.category === ExerciseCategory.STRENGTH ? <Dumbbell size={20} /> : <Zap size={20} />}
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{ex.category}</span>
              </div>
              
              <div className="p-6 flex-1 flex flex-col space-y-4">
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">{ex.name}</h4>
                    <div className="flex flex-wrap gap-1">
                       {ex.muscles.map(m => (
                         <span key={m} className="text-[7px] font-black uppercase bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">{m}</span>
                       ))}
                    </div>
                 </div>

                 <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                    {ex.description}
                 </p>

                 <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase">{t.sets}</span>
                          {isEditing ? (
                            <input 
                              type="number" 
                              className="w-full text-center bg-white border border-slate-200 rounded p-1 text-xs font-black"
                              value={editValues.sets}
                              onChange={e => setEditValues({...editValues, sets: parseInt(e.target.value) || 0})}
                            />
                          ) : (
                            <span className="text-sm font-black text-slate-700">{ex.sets}</span>
                          )}
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase">{t.reps}</span>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full text-center bg-white border border-slate-200 rounded p-1 text-xs font-black"
                              value={editValues.reps}
                              onChange={e => setEditValues({...editValues, reps: e.target.value})}
                            />
                          ) : (
                            <span className="text-sm font-black text-slate-700">{ex.reps}</span>
                          )}
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase">{t.rest}</span>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full text-center bg-white border border-slate-200 rounded p-1 text-xs font-black"
                              value={editValues.rest}
                              onChange={e => setEditValues({...editValues, rest: e.target.value})}
                            />
                          ) : (
                            <span className="text-sm font-black text-slate-700">{ex.rest}</span>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => setEditingExId(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase"><X size={16} className="mx-auto" /></button>
                          <button onClick={() => saveEdit(ex.id)} className="flex-[2] py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2"><Check size={16} /> Salva</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(ex)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-400 text-[9px] font-black uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><Pencil size={14} /> {t.editParams}</button>
                          {onAssign && (
                            <button onClick={() => onAssign(ex, 'ALL')} className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase hover:bg-blue-700 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"><Users size={14} /> {t.assignToAll}</button>
                          )}
                        </>
                      )}
                    </div>
                    {onAssign && !isEditing && playerOptions.length > 0 && (
                      <div className="relative group/assign">
                         <button className="w-full py-3 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase hover:bg-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                            <UserPlus size={14} /> {t.assignToPlayer}
                         </button>
                         <div className="absolute bottom-full left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl opacity-0 invisible group-hover/assign:opacity-100 group-hover/assign:visible transition-all z-50 max-h-40 overflow-y-auto custom-scrollbar p-2 mb-2">
                            {playerOptions.map(p => (
                              <button key={p.id} onClick={() => onAssign(ex, p.id)} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg text-[10px] font-black uppercase text-slate-700 transition-colors border-b border-slate-50 last:border-0">{p.name}</button>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
                 <h3 className="font-black uppercase tracking-tight text-xl">{t.newExercise}</h3>
                 <button onClick={() => setShowCreateModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Esercizio</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newEx.name} onChange={e => setNewEx({...newEx, name: e.target.value})} placeholder="Esempio: Plank con tocco spalle" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                       <select className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={newEx.category} onChange={e => setNewEx({...newEx, category: e.target.value as ExerciseCategory})}>
                          {Object.values(ExerciseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Muscoli Target</label>
                       <input type="text" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={newEx.muscles as any} onChange={e => setNewEx({...newEx, muscles: e.target.value as any})} placeholder="Addominali, Braccia" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.description}</label>
                    <textarea className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium h-24" value={newEx.description} onChange={e => setNewEx({...newEx, description: e.target.value})} />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase text-slate-400 bg-slate-50">{t.decline}</button>
                    <button onClick={handleCreate} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl active:scale-95">Crea Esercizio</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
