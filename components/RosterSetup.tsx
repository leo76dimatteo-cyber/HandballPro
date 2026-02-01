
import React, { useState, useMemo, useEffect } from 'react';
import { Player } from '../types';
import { UserPlus, Trash2, Download, Hash, Search, CheckCircle2, Users, User, ChevronDown, ChevronUp, UserCog, Star, Shield, ClipboardList, X, Check, Filter, Zap, UserCheck } from 'lucide-react';
import { storage } from '../services/storageService';

const PREDEFINED_STAFF_ROLES = [
  "1° Allenatore", 
  "2° Allenatore", 
  "Preparatore Portieri",
  "Preparatore Atletico",
  "Dirigente Accompagnatore",
  "Dirigente A",
  "Dirigente B",
  "Dirigente C",
  "Massaggiatore",
  "Ufficiale A", 
  "Ufficiale B", 
  "Ufficiale C", 
  "Ufficiale D", 
  "Medico", 
  "Fisioterapista",
  "Segretario",
  "Collaboratore"
];

const QUICK_STAFF_ROLES = [
  { label: "2° All.", value: "2° Allenatore", icon: UserCog },
  { label: "Dir. A", value: "Dirigente A", icon: Shield },
  { label: "Dir. B", value: "Dirigente B", icon: Shield },
  { label: "Dir. C", value: "Dirigente C", icon: Shield },
];

interface RosterSetupProps {
  teamName: string;
  roster: Player[];
  staff: Player[];
  onUpdate: (roster: Player[]) => void;
  onUpdateStaff: (staff: Player[]) => void;
  accentColor?: 'blue' | 'red';
  onImportRegistry?: () => void;
  hasRegistry?: boolean;
  registryPlayers?: Player[];
  t: any;
}

const RosterSetup: React.FC<RosterSetupProps> = ({ 
  teamName, 
  roster, 
  staff,
  onUpdate, 
  onUpdateStaff,
  accentColor = 'blue',
  onImportRegistry,
  hasRegistry = false,
  registryPlayers = [],
  t
}) => {
  const [mode, setMode] = useState<'PLAYER' | 'STAFF'>('PLAYER');
  const [newNumber, setNewNumber] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState('1° Allenatore');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedInModal, setSelectedInModal] = useState<Set<string>>(new Set());
  const [importStaff, setImportStaff] = useState(true);

  const isBlue = accentColor === 'blue';
  const isOpponent = accentColor === 'red';

  // Autocomplete basato sul numero se presente in anagrafica (solo per Player)
  useEffect(() => {
    if (mode === 'PLAYER' && newNumber) {
      const found = registryPlayers.find(p => p.number === newNumber);
      if (found) {
        setNewFirstName(found.firstName);
        setNewLastName(found.lastName);
      }
    }
  }, [newNumber, registryPlayers, mode]);

  const availableFromRegistry = useMemo(() => {
    if (!registryPlayers.length) return [];
    const inRosterNumbers = new Set(roster.map(p => p.number));
    return registryPlayers
      .filter(p => !inRosterNumbers.has(p.number))
      .sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));
  }, [registryPlayers, roster]);

  const filteredRegistryForModal = useMemo(() => {
    return availableFromRegistry.filter(p => 
      p.lastName.toLowerCase().includes(modalSearch.toLowerCase()) || 
      p.number.includes(modalSearch)
    );
  }, [availableFromRegistry, modalSearch]);

  const handleAdd = () => {
    const finalFirst = newFirstName.trim().toUpperCase();
    const finalLast = newLastName.trim().toUpperCase();

    if (!finalLast) {
      alert("Inserisci almeno il cognome.");
      return;
    }

    if (mode === 'PLAYER') {
      const finalNumber = newNumber.trim();
      if (!finalNumber) { alert("Inserisci il numero di maglia."); return; }
      if (roster.find(p => p.number === finalNumber)) { alert(`Il numero ${finalNumber} è già presente.`); return; }

      const newPlayer: Player = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: finalFirst || (isOpponent ? "" : "Atleta"),
        lastName: finalLast || "Giocatore",
        number: finalNumber
      };
      onUpdate([...roster, newPlayer]);
      setNewNumber('');
    } else {
      const finalRole = newRole.trim() || "Membro Staff";
      const newMember: Player = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: finalFirst,
        lastName: finalLast,
        number: "S",
        role: finalRole
      };
      onUpdateStaff([...staff, newMember]);
    }

    setNewFirstName('');
    setNewLastName('');
  };

  const handleQuickAddPlayer = (ap: Player) => {
    if (roster.find(p => p.number === ap.number)) return;
    const newPlayer: Player = { ...ap, id: Math.random().toString(36).substr(2, 9) };
    onUpdate([...roster, newPlayer]);
  };

  const toggleModalSelection = (id: string) => {
    const next = new Set(selectedInModal);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInModal(next);
  };

  const selectAllModal = () => {
    setSelectedInModal(new Set(filteredRegistryForModal.map(p => p.id)));
  };

  const confirmModalImport = (forceAll: boolean = false) => {
    const idsToImport = forceAll 
      ? new Set(registryPlayers.map(p => p.id)) 
      : selectedInModal;

    const toImport = registryPlayers.filter(p => idsToImport.has(p.id));
    const newRoster = [...roster];
    
    toImport.forEach(p => {
      if (!newRoster.find(existing => existing.number === p.number)) {
        newRoster.push({ ...p, id: Math.random().toString(36).substr(2, 9) });
      }
    });
    
    onUpdate(newRoster);

    if (importStaff || forceAll) {
      const registry = storage.getRegistry();
      const newStaff = [...staff];
      
      if (registry.coachName) {
        const coachNameUpper = registry.coachName.toUpperCase();
        if (!newStaff.find(s => s.lastName === coachNameUpper && s.role === '1° Allenatore')) {
          newStaff.push({ id: 'c1-'+Date.now(), firstName: '', lastName: coachNameUpper, number: 'S', role: '1° Allenatore' });
        }
      }
      if (registry.assistantCoachName) {
        const asstNameUpper = registry.assistantCoachName.toUpperCase();
        if (!newStaff.find(s => s.lastName === asstNameUpper && s.role === '2° Allenatore')) {
          newStaff.push({ id: 'c2-'+Date.now(), firstName: '', lastName: asstNameUpper, number: 'S', role: '2° Allenatore' });
        }
      }
      onUpdateStaff(newStaff);
    }

    setShowImportModal(false);
    setSelectedInModal(new Set());
    setModalSearch('');
    setImportStaff(true);
  };

  const removePlayer = (id: string) => onUpdate(roster.filter(p => p.id !== id));
  const removeStaff = (id: string) => onUpdateStaff(staff.filter(p => p.id !== id));

  const ringColor = isBlue ? 'focus:ring-blue-500' : 'focus:ring-red-500';
  const btnColor = isBlue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';
  
  return (
    <div className={`rounded-3xl shadow-sm border ${isBlue ? 'border-blue-100' : 'border-red-100'} bg-white overflow-hidden transition-all flex flex-col min-h-[500px]`}>
      <div className={`${isBlue ? 'bg-blue-600' : 'bg-red-600'} px-5 py-4 flex items-center justify-between cursor-pointer`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2 uppercase tracking-tight truncate pr-2 max-w-[200px]">
            {teamName}
          </h3>
          <span className="text-[8px] md:text-[9px] font-bold text-white/70 uppercase tracking-widest">{isBlue ? 'Home' : 'Away'} Setup</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg border border-white/10">
             <Users size={12} className="text-white/70" />
             <span className="text-[10px] font-black text-white">{roster.length}</span>
             <span className="text-white/30 text-[10px]">|</span>
             <UserCog size={12} className="text-white/70" />
             <span className="text-[10px] font-black text-white">{staff.length}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 md:p-5 flex-1 flex flex-col animate-in fade-in slide-in-from-top-2">
          
          {/* Selettore Modalità e Importazione */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
               <button onClick={() => setMode('PLAYER')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'PLAYER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Users size={14} /> Atleti
               </button>
               <button onClick={() => setMode('STAFF')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'STAFF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <UserCog size={14} /> Area Tecnica
               </button>
            </div>

            {hasRegistry && (
              <button 
                onClick={() => setShowImportModal(true)}
                className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isBlue ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
              >
                <Download size={14} /> Importa da Anagrafica
              </button>
            )}
          </div>

          {/* Sezione Ruoli Rapidi Staff */}
          {mode === 'STAFF' && (
            <div className="mb-3">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Seleziona Ruolo Rapido</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {QUICK_STAFF_ROLES.map((qr) => (
                  <button
                    key={qr.label}
                    onClick={() => setNewRole(qr.value)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-tight shadow-sm ${newRole === qr.value ? (isBlue ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white') : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <qr.icon size={12} className={newRole === qr.value ? 'text-white' : 'text-slate-400'} />
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Inserimento Dinamico */}
          <div className={`mb-4 p-4 rounded-2xl border shadow-inner transition-all ${mode === 'PLAYER' ? 'bg-slate-50 border-slate-100' : (isBlue ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100')}`}>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-2">
                {mode === 'PLAYER' ? (
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      placeholder="N°"
                      className={`w-full px-2 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none text-center font-black text-slate-800 text-sm`}
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 relative">
                    <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    <input
                      list={`staff-roles-${accentColor}`}
                      placeholder="Ruolo (es. Massaggiatore)"
                      className={`w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none font-black text-slate-700 text-[11px] uppercase placeholder:font-normal placeholder:text-slate-400`}
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    />
                    <datalist id={`staff-roles-${accentColor}`}>
                      {PREDEFINED_STAFF_ROLES.map(r => <option key={r} value={r} />)}
                    </datalist>
                  </div>
                )}
                <div className={mode === 'PLAYER' ? 'flex-1' : 'flex-1'}>
                  <input
                    type="text"
                    placeholder={t.lastName}
                    className={`w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none font-black text-slate-800 uppercase text-sm`}
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.firstName}
                  className={`flex-1 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none font-black text-slate-800 uppercase text-sm`}
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value.toUpperCase())}
                />
                <button
                  onClick={handleAdd}
                  className={`w-14 h-[45px] ${btnColor} text-white flex items-center justify-center rounded-xl transition-all shadow-md active:scale-95`}
                >
                  <UserPlus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Suggerimenti Veloci Atleti */}
          {mode === 'PLAYER' && hasRegistry && availableFromRegistry.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5 px-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Users size={10} /> Suggeriti
                  </label>
                  <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-[8px] font-black text-blue-600 uppercase">
                    {showQuickAdd ? 'Chiudi' : 'Vedi Tutti'}
                  </button>
              </div>
              <div className={`overflow-x-auto py-1 no-scrollbar flex items-center gap-2 ${showQuickAdd ? 'flex-wrap' : ''}`}>
                  {availableFromRegistry.map((ap, idx) => {
                    if (!showQuickAdd && idx > 8) return null;
                    return (
                      <button
                        key={ap.id}
                        onClick={() => handleQuickAddPlayer(ap)}
                        className="shrink-0 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-lg py-1.5 px-2.5 hover:bg-blue-50 transition-all group min-w-[50px] shadow-sm"
                      >
                        <span className="text-[10px] font-black text-slate-700 group-hover:text-blue-600">{ap.number}</span>
                        <span className="text-[6px] font-bold text-slate-400 uppercase truncate w-full text-center">
                          {ap.lastName.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Lista Unificata (Atleti & Staff) */}
          <div className="flex-1 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar space-y-4">
            {staff.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">
                  <UserCog size={10} /> Area Tecnica
                </h4>
                {staff.map(s => {
                   const isCoach = s.role?.includes("Allenatore");
                   const isOfficial = s.role?.includes("Dirigente") || s.role?.includes("Ufficiale");
                   return (
                    <div key={s.id} className={`flex items-center justify-between p-2 rounded-xl border border-slate-100 shadow-sm transition-all ${isCoach ? (isBlue ? 'bg-blue-50/50' : 'bg-red-50/50') : 'bg-white'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isBlue ? 'border-blue-100 text-blue-600' : 'border-red-100 text-red-600'} bg-white`}>
                           {isCoach ? <Star size={14} fill="currentColor" /> : isOfficial ? <Shield size={14} /> : <UserCheck size={14} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-800 uppercase tracking-tight text-xs leading-none mb-1 truncate">{s.lastName} {s.firstName}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded inline-block w-fit ${isBlue ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{s.role}</span>
                        </div>
                      </div>
                      <button onClick={() => removeStaff(s.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Users size={10} /> Atleti Convocati
                </h4>
              </div>
              {roster.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                  <p className="text-slate-300 text-[8px] font-black uppercase tracking-widest">Nessun Atleta in Lista</p>
                </div>
              ) : (
                [...roster].reverse().map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex items-center justify-center w-8 h-8 ${isBlue ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'} rounded-lg font-black text-sm border shrink-0`}>
                        {player.number}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-800 uppercase tracking-tight text-xs leading-none truncate mb-1">
                          {player.lastName}
                        </span>
                        <span className="text-slate-400 font-bold text-[7px] uppercase tracking-widest truncate">
                          {player.firstName}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removePlayer(player.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className={`p-6 text-white flex justify-between items-center ${isBlue ? 'bg-blue-600' : 'bg-red-600'}`}>
              <div>
                <h3 className="font-black uppercase tracking-widest text-sm">Importa da Anagrafica</h3>
                <p className="text-[10px] font-bold opacity-70">Seleziona chi convocare per questo match</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col min-h-0">
              {/* Pulsante Importa Tutto Unificato */}
              <button 
                onClick={() => confirmModalImport(true)}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-lg border-2 border-transparent hover:scale-[1.02] active:scale-95 mb-2 ${isBlue ? 'bg-blue-900 text-white shadow-blue-100' : 'bg-red-900 text-white shadow-red-100'}`}
              >
                <Zap size={18} className="text-amber-400 fill-amber-400" />
                Importa Tutto il Team (Atleti + Staff)
              </button>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Cerca per cognome o numero..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={selectAllModal}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Seleziona Tutti
                </button>
                <button 
                  onClick={() => setSelectedInModal(new Set())}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:underline"
                >
                  Deseleziona
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                <div 
                  onClick={() => setImportStaff(!importStaff)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${importStaff ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-white'}`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${importStaff ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <UserCog size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-800 leading-tight">Area Tecnica</p>
                        <p className="text-[9px] font-medium text-slate-500">Includi 1° e 2° Allenatore salvati</p>
                      </div>
                   </div>
                   <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${importStaff ? 'bg-amber-400 border-amber-400' : 'border-slate-200'}`}>
                      {importStaff && <Check size={12} className="text-white" />}
                   </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {filteredRegistryForModal.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={32} className="text-slate-100 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-300 uppercase">Nessun atleta disponibile</p>
                  </div>
                ) : (
                  filteredRegistryForModal.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => toggleModalSelection(p.id)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedInModal.has(p.id) ? (isBlue ? 'border-blue-400 bg-blue-50' : 'border-red-400 bg-red-50') : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedInModal.has(p.id) ? (isBlue ? 'bg-blue-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-100 text-slate-500'}`}>
                            {p.number}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-slate-800 leading-tight">{p.lastName}</p>
                            <p className="text-[10px] font-medium text-slate-400">{p.firstName}</p>
                          </div>
                       </div>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedInModal.has(p.id) ? (isBlue ? 'bg-blue-600 border-blue-600' : 'bg-red-600 border-red-600') : 'border-slate-200'}`}>
                          {selectedInModal.has(p.id) && <Check size={12} className="text-white" />}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button 
                 onClick={() => setShowImportModal(false)}
                 className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-white border border-slate-200 hover:bg-slate-100"
               >
                 Annulla
               </button>
               <button 
                 onClick={() => confirmModalImport(false)}
                 disabled={selectedInModal.size === 0 && !importStaff}
                 className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${isBlue ? 'bg-blue-600 shadow-blue-100' : 'bg-red-600 shadow-red-100'}`}
               >
                 Conferma ({selectedInModal.size + (importStaff ? 2 : 0)})
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterSetup;
