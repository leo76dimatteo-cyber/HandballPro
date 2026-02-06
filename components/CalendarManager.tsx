
import React, { useState } from 'react';
import { ScheduledMatch } from '../types';
import { storage } from '../services/storageService';
import { Calendar, Plus, Trash2, Play, Clock, MapPin, Layers, X, ArrowLeft, Share2, FileJson, Info } from 'lucide-react';

interface CalendarManagerProps {
  matches: ScheduledMatch[];
  onAdd: (match: ScheduledMatch) => void;
  onDelete: (id: string) => void;
  onStart: (match: ScheduledMatch) => void;
  onBack: () => void;
  canEdit: boolean;
  suggestedCategories: string[];
  t: any;
}

const CalendarManager: React.FC<CalendarManagerProps> = ({ 
  matches, onAdd, onDelete, onStart, onBack, canEdit, suggestedCategories, t
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMatch, setNewMatch] = useState<Partial<ScheduledMatch>>({
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    category: 'Serie B'
  });

  const handleAdd = () => {
    if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.date || !newMatch.time) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    const match: ScheduledMatch = {
      id: Math.random().toString(36).substr(2, 9),
      date: newMatch.date!,
      time: newMatch.time!,
      homeTeam: newMatch.homeTeam!.toUpperCase(),
      awayTeam: newMatch.awayTeam!.toUpperCase(),
      category: newMatch.category || 'Serie B'
    };

    onAdd(match);
    setShowAddForm(false);
    setNewMatch({
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      category: 'Serie B'
    });
  };

  const handleExport = () => {
    if (matches.length === 0) {
      alert("Nessuna gara in calendario da esportare.");
      return;
    }
    storage.exportData(matches, 'HPro_Calendario');
  };

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-8 px-2 md:px-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-md shrink-0">
              <Calendar className="text-white" size={20} />
            </div>
            Calendario
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Gestione prossima stagione e turni</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 px-5 py-3 rounded-xl font-black flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            <Share2 size={16} /> Esporta
          </button>
          {canEdit && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <Plus size={18} /> Aggiungi
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Pianifica Nuova Gara</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMatch.date}
                    onChange={e => setNewMatch({...newMatch, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ora</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMatch.time}
                    onChange={e => setNewMatch({...newMatch, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    list="cal-categories"
                    type="text" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMatch.category}
                    onChange={e => setNewMatch({...newMatch, category: e.target.value})}
                    placeholder="Seleziona o scrivi"
                  />
                  <datalist id="cal-categories">
                    {suggestedCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">La mia Squadra (Casa)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-900 uppercase tracking-tighter placeholder:font-normal placeholder:text-slate-300"
                  value={newMatch.homeTeam}
                  onChange={e => setNewMatch({...newMatch, homeTeam: e.target.value})}
                  placeholder="LA MIA SQUADRA"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Avversari (Trasferta)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-900 uppercase tracking-tighter placeholder:font-normal placeholder:text-slate-300"
                  value={newMatch.awayTeam}
                  onChange={e => setNewMatch({...newMatch, awayTeam: e.target.value})}
                  placeholder="AVVERSARI"
                />
              </div>

              <button 
                onClick={handleAdd}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 transition-all mt-4"
              >
                Conferma e Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <Calendar className="text-slate-100 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800 mb-1">Calendario Vuoto</h3>
          <p className="text-slate-400 font-medium text-xs px-10">Inserisci le prossime partite per averle a portata di click.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {[...matches].sort((a,b) => a.date.localeCompare(b.date)).map((match) => (
            <div 
              key={match.id}
              className="group bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all overflow-hidden flex flex-col md:flex-row items-stretch"
            >
              <div className="bg-slate-50 md:w-36 p-4 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r border-slate-100 gap-2 shrink-0">
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(match.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'})}</span>
                   <div className="flex items-center gap-1 text-[10px] font-black text-blue-600">
                      <Clock size={10} /> {match.time}
                   </div>
                </div>
                <span className="text-[8px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-tighter truncate max-w-[80px]">{match.category}</span>
              </div>

              <div className="flex-1 p-5 md:px-10 flex flex-col justify-center">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex-1 text-right min-w-0">
                    <h4 className="text-sm md:text-xl font-black text-slate-800 uppercase tracking-tight truncate">{match.homeTeam}</h4>
                  </div>
                  
                  <div className="px-4 py-1 bg-slate-100 rounded-full text-slate-300 font-black text-xs shrink-0">VS</div>

                  <div className="flex-1 text-left min-w-0">
                    <h4 className="text-sm md:text-xl font-black text-slate-800 uppercase tracking-tight truncate">{match.awayTeam}</h4>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 flex items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100">
                <button 
                  onClick={() => onStart(match)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95"
                >
                  <Play size={14} fill="currentColor" /> Vai a Setup
                </button>
                {canEdit && (
                  <button 
                    onClick={() => onDelete(match.id)}
                    className="p-3 text-slate-300 hover:text-red-500 bg-white border border-slate-100 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4 shadow-inner">
         <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0"><Info size={24} /></div>
         <div>
            <h4 className="font-black text-blue-900 uppercase tracking-tight text-sm">Guida Calendario</h4>
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed mt-1">
               Pianifica le prossime sfide inserendo <strong>Data</strong>, <strong>Ora</strong> e <strong>Team</strong>. Le gare salvate rimarranno in questo archivio finché non deciderai di avviarle tramite il tasto "Vai a Setup", che popolerà automaticamente i campi della nuova partita. Ti consigliamo di esportare periodicamente il calendario per sicurezza.
            </p>
         </div>
      </div>
    </div>
  );
};

export default CalendarManager;
