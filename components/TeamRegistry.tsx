
import React, { useState, useRef } from 'react';
import { TeamProfile, Player } from '../types';
import { Save, UserPlus, Trash2, Shield, UserCircle, Briefcase, AlertCircle, Layers, Lock, Users } from 'lucide-react';

const SUGGESTED_CATEGORIES = [
  "Serie A Gold", "Serie A Silver", "Serie A1 F", "Serie A2", "Serie B", 
  "Under 20", "Under 17", "Under 15", "Under 13", "Amichevole"
];

interface TeamRegistryProps { 
  profile: TeamProfile; 
  onSave: (profile: TeamProfile) => void; 
  isAdmin?: boolean;
}

const TeamRegistry: React.FC<TeamRegistryProps> = ({ profile, onSave, isAdmin = false }) => {
  const [teamName, setTeamName] = useState(profile.teamName);
  const [coachName, setCoachName] = useState(profile.coachName);
  const [assistantCoachName, setAssistantCoachName] = useState(profile.assistantCoachName || '');
  const [category, setCategory] = useState(profile.category || "Serie B");
  const [players, setPlayers] = useState<Player[]>(profile.players);

  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newNum, setNewNum] = useState('');
  const [showError, setShowError] = useState(false);

  const numInputRef = useRef<HTMLInputElement>(null);

  const addPlayer = () => {
    if (!isAdmin) return;
    if (!newFirst.trim() || !newLast.trim() || !newNum.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      return;
    }

    if (players.find(p => p.number === newNum.trim())) {
      alert(`Il numero ${newNum} è già assegnato a un altro giocatore in anagrafica.`);
      return;
    }

    const p: Player = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: newFirst.trim(),
      lastName: newLast.trim(),
      number: newNum.trim()
    };

    setPlayers([...players, p]);
    setNewFirst('');
    setNewLast('');
    setNewNum('');
    numInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addPlayer();
  };

  const removePlayer = (id: string) => { 
    if (!isAdmin) return;
    if(confirm("Rimuovere definitivamente questo giocatore dall'anagrafica?")) {
      setPlayers(players.filter(p => p.id !== id)); 
    }
  };

  const handleSave = () => {
    if (!isAdmin) return;
    onSave({ teamName, coachName, assistantCoachName, category, players });
    alert('Anagrafica salvata correttamente nel database locale.');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Anagrafica Squadra</h2>
          <p className="text-slate-500 font-medium">Archivio centrale dei tesserati e staff tecnico</p>
        </div>
        
        {isAdmin ? (
          <button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            <Save size={20} />
            Salva nel Database
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-100 text-slate-400 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200">
            <Lock size={16} />
            Sola Lettura
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className={`bg-white p-1 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden ${!isAdmin ? 'opacity-75 pointer-events-none' : ''}`}>
             <div className="bg-slate-900 px-6 py-4 flex items-center gap-2">
                <Shield size={18} className="text-blue-400" />
                <h3 className="font-black text-white uppercase tracking-widest text-[10px]">Identità Societaria</h3>
             </div>
             <div className="p-6 space-y-6 bg-gradient-to-b from-white to-slate-50/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Denominazione Ufficiale</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 shadow-sm transition-all"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Es: Handball Club Milano"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Categoria Federale</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      list="registry-categories"
                      disabled={!isAdmin}
                      type="text"
                      className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 shadow-sm transition-all placeholder:font-normal placeholder:text-slate-300"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Inserisci o seleziona categoria"
                    />
                    <datalist id="registry-categories">
                      {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Primo Allenatore</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      disabled={!isAdmin}
                      className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 shadow-sm transition-all"
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      placeholder="Nome e Cognome"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Secondo Allenatore</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      disabled={!isAdmin}
                      className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 shadow-sm transition-all"
                      value={assistantCoachName}
                      onChange={(e) => setAssistantCoachName(e.target.value)}
                      placeholder="Nome e Cognome"
                    />
                  </div>
                </div>
             </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
             <div className="flex gap-3">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  {isAdmin 
                    ? "Come Amministratore, hai il controllo totale su nomi, ruoli e numeri di maglia ufficiali." 
                    : "L'anagrafica è in modalità sola lettura. Contatta l'Amministratore per modifiche ai tesserati."}
                </p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-1 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle size={18} className="text-white" />
                  <h3 className="font-black text-white uppercase tracking-widest text-[10px]">Rosa Giocatori</h3>
                </div>
                <span className="text-[10px] font-black text-blue-100 bg-black/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {players.length} Tesserati
                </span>
            </div>

            <div className="p-6 flex flex-col flex-1">
              {isAdmin && (
                <div className={`grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 p-5 rounded-3xl border transition-all ${showError ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-blue-50/50 border-blue-100/50'}`}>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-blue-400 uppercase mb-1 block ml-1">N°</label>
                    <input
                      ref={numInputRef}
                      type="text"
                      placeholder="99"
                      className="w-full px-3 py-3 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center font-black bg-white"
                      value={newNum}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewNum(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-[9px] font-black text-blue-400 uppercase mb-1 block ml-1">Nome</label>
                    <input
                      type="text"
                      placeholder="Mario"
                      className="w-full px-4 py-3 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white"
                      value={newFirst}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewFirst(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-[9px] font-black text-blue-400 uppercase mb-1 block ml-1">Cognome</label>
                    <input
                      type="text"
                      placeholder="Rossi"
                      className="w-full px-4 py-3 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white"
                      value={newLast}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewLast(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button
                      onClick={addPlayer}
                      title="Aggiungi Atleta"
                      className="w-full h-[48px] bg-slate-900 text-white flex items-center justify-center rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                      <UserPlus size={22} />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {players.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    <UserCircle size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nessun giocatore in archivio</p>
                  </div>
                ) : (
                  [...players].reverse().map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/10 transition-all group animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-6">
                        <span className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white font-black rounded-xl text-lg shadow-md group-hover:bg-blue-600 transition-colors">
                          {p.number}
                        </span>
                        <div>
                          <p className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none">
                            {p.lastName}
                          </p>
                          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                            {p.firstName}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => removePlayer(p.id)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistry;
