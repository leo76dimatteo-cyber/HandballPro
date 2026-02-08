
import React, { useState, useMemo, useEffect } from 'react';
import { Player, HandballRole, TeamProfile } from '../types';
import { UserPlus, Trash2, Download, Hash, Search, CheckCircle2, Users, User, ChevronDown, ChevronUp, UserCog, Star, Shield, ClipboardList, X, Check, Filter, Zap, UserCheck, Pencil, BookOpen, Info, Layers } from 'lucide-react';
import { storage } from '../services/storageService';

const ALL_HANDBALL_ROLES = Object.values(HandballRole).filter(r => r !== HandballRole.ND);

const PREDEFINED_STAFF_ROLES = [
  "1° Allenatore", 
  "2° Allenatore", 
  "Dirigente A",
  "Dirigente B",
  "Dirigente C",
  "Dirigente Accompagnatore",
  "Ufficiale A", 
  "Ufficiale B", 
  "Ufficiale C", 
  "Ufficiale D", 
  "Medico", 
  "Fisioterapista",
  "Massaggiatore",
  "Preparatore Portieri",
  "Preparatore Atletico",
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
  allRegistries?: TeamProfile[];
  t: any;
}

const RosterSetup: React.FC<RosterSetupProps> = ({ 
  teamName, 
  roster, 
  staff,
  onUpdate, 
  onUpdateStaff,
  accentColor = 'blue',
  allRegistries = [],
  t
}) => {
  const [mode, setMode] = useState<'PLAYER' | 'STAFF'>('PLAYER');
  const [newNumber, setNewNumber] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState('1° Allenatore');
  const [newRoles, setNewRoles] = useState<HandballRole[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRegistryIndex, setSelectedRegistryIndex] = useState<number>(-1);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedInModal, setSelectedInModal] = useState<Set<string>>(new Set());
  const [importStaff, setImportStaff] = useState(true);

  const isBlue = accentColor === 'blue';

  // Tentativo di pre-selezionare l'anagrafica che corrisponde al nome del team
  useEffect(() => {
    if (showImportModal && selectedRegistryIndex === -1 && allRegistries.length > 0) {
      const matchIdx = allRegistries.findIndex(r => r.teamName.toUpperCase() === teamName.toUpperCase());
      if (matchIdx !== -1) {
        setSelectedRegistryIndex(matchIdx);
      } else {
        setSelectedRegistryIndex(0);
      }
    }
  }, [showImportModal, teamName, allRegistries]);

  const currentRegistry = selectedRegistryIndex !== -1 ? allRegistries[selectedRegistryIndex] : null;

  const availableFromRegistry = useMemo(() => {
    if (!currentRegistry) return [];
    return currentRegistry.players.filter(p => !roster.find(existing => existing.number === p.number));
  }, [currentRegistry, roster]);

  const filteredRegistryForModal = useMemo(() => {
    if (!currentRegistry) return [];
    return currentRegistry.players.filter(p => 
      p.lastName.toLowerCase().includes(modalSearch.toLowerCase()) || 
      p.number.includes(modalSearch)
    );
  }, [currentRegistry, modalSearch]);

  const togglePlayerRole = (role: HandballRole) => {
    setNewRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const startEdit = (p: Player, type: 'PLAYER' | 'STAFF') => {
    setMode(type);
    setEditingId(p.id);
    setNewFirstName(p.firstName);
    setNewLastName(p.lastName);
    if (type === 'PLAYER') {
      setNewNumber(p.number);
      setNewRoles(p.roles || []);
    } else {
      setNewRole(p.role || '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewFirstName('');
    setNewLastName('');
    setNewNumber('');
    setNewRole('1° Allenatore');
    setNewRoles([]);
  };

  const handleAddOrUpdate = () => {
    const finalFirst = newFirstName.trim().toUpperCase();
    const finalLast = newLastName.trim().toUpperCase();
    if (!finalLast) { alert("Inserisci almeno il cognome."); return; }
    if (mode === 'PLAYER') {
      const finalNumber = newNumber.trim();
      if (!finalNumber) { alert("Inserisci il numero di maglia."); return; }
      if (roster.find(p => p.number === finalNumber && p.id !== editingId)) { alert(`Il numero ${finalNumber} è già assegnato.`); return; }
      if (editingId) {
        onUpdate(roster.map(p => p.id === editingId ? { ...p, firstName: finalFirst, lastName: finalLast, number: finalNumber, roles: newRoles.length > 0 ? newRoles : [HandballRole.ND] } : p));
      } else {
        const newPlayer: Player = { id: Math.random().toString(36).substr(2, 9), firstName: finalFirst, lastName: finalLast, number: finalNumber, roles: newRoles.length > 0 ? newRoles : [HandballRole.ND] };
        onUpdate([...roster, newPlayer]);
      }
      setNewNumber(''); setNewRoles([]);
    } else {
      const finalRole = newRole.trim() || "Membro Staff";
      if (editingId) {
        onUpdateStaff(staff.map(s => s.id === editingId ? { ...s, firstName: finalFirst, lastName: finalLast, role: finalRole.toUpperCase() } : s));
      } else {
        const newMember: Player = { id: Math.random().toString(36).substr(2, 9), firstName: finalFirst, lastName: finalLast, number: "S", role: finalRole.toUpperCase() };
        onUpdateStaff([...staff, newMember]);
      }
      if (!PREDEFINED_STAFF_ROLES.includes(newRole)) setNewRole('1° Allenatore');
    }
    setNewFirstName(''); setNewLastName(''); setEditingId(null);
  };

  const handleQuickAddPlayer = (ap: Player) => {
    if (roster.find(p => p.number === ap.number)) return;
    const newPlayer: Player = { ...ap, id: Math.random().toString(36).substr(2, 9) };
    onUpdate([...roster, newPlayer]);
  };

  const confirmModalImport = (forceAll: boolean = false) => {
    if (!currentRegistry) return;
    const idsToImport = forceAll ? new Set(currentRegistry.players.map(p => p.id)) : selectedInModal;
    const toImport = currentRegistry.players.filter(p => idsToImport.has(p.id));
    const newRoster = [...roster];
    toImport.forEach(p => { if (!newRoster.find(existing => existing.number === p.number)) newRoster.push({ ...p, id: Math.random().toString(36).substr(2, 9) }); });
    onUpdate(newRoster);
    if (importStaff || forceAll) {
      const newStaff = [...staff];
      if (currentRegistry.coachName) {
        const coachNameUpper = currentRegistry.coachName.toUpperCase();
        if (!newStaff.find(s => s.lastName === coachNameUpper)) newStaff.push({ id: 'c1-'+Date.now(), firstName: '', lastName: coachNameUpper, number: 'S', role: '1° ALLENATORE' });
      }
      onUpdateStaff(newStaff);
    }
    setShowImportModal(false); setSelectedInModal(new Set()); setModalSearch('');
  };

  const removePlayer = (id: string) => { if (editingId === id) cancelEdit(); onUpdate(roster.filter(p => p.id !== id)); };
  const removeStaff = (id: string) => { if (editingId === id) cancelEdit(); onUpdateStaff(staff.filter(p => p.id !== id)); };

  const ringColor = isBlue ? 'focus:ring-blue-500' : 'focus:ring-red-500';
  const btnColor = isBlue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';
  
  return (
    <div className={`rounded-3xl shadow-sm border ${isBlue ? 'border-blue-100' : 'border-red-100'} bg-white overflow-hidden transition-all flex flex-col min-h-[500px]`}>
      <div className={`${isBlue ? 'bg-blue-600' : 'bg-red-600'} px-5 py-4 flex items-center justify-between cursor-pointer`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col">
          <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2 uppercase tracking-tight truncate pr-2 max-w-[200px]">{teamName}</h3>
          <span className="text-[8px] md:text-[9px] font-bold text-white/70 uppercase tracking-widest">{isBlue ? 'Casa' : 'Trasferta'} Setup</span>
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
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
               <button onClick={() => { if(!editingId) setMode('PLAYER'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'PLAYER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}><Users size={14} /> Atleti</button>
               <button onClick={() => { if(!editingId) setMode('STAFF'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'STAFF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}><UserCog size={14} /> Area Tecnica</button>
            </div>
            {allRegistries.length > 0 && !editingId && (
              <button onClick={() => setShowImportModal(true)} className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isBlue ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}><Download size={14} /> Importa da Anagrafica</button>
            )}
          </div>

          <div className="mb-3 animate-in fade-in slide-in-from-left-2">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">{mode === 'STAFF' ? 'Ruoli Rapidi Area Tecnica' : 'Ruoli Specifici Atleta'}</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {mode === 'STAFF' ? (
                QUICK_STAFF_ROLES.map((qr) => (
                  <button key={qr.label} onClick={() => setNewRole(qr.value)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-tight shadow-sm ${newRole === qr.value ? (isBlue ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white') : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}><qr.icon size={12} className={newRole === qr.value ? 'text-white' : 'text-slate-400'} /> {qr.label}</button>
                ))
              ) : (
                ALL_HANDBALL_ROLES.map(role => (
                  <button key={role} onClick={() => togglePlayerRole(role)} className={`shrink-0 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all ${newRoles.includes(role) ? (isBlue ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white') : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{role}</button>
                ))
              )}
            </div>
          </div>

          <div className={`mb-4 p-4 rounded-2xl border shadow-inner transition-all ${editingId ? 'ring-2 ring-amber-400' : ''} ${mode === 'PLAYER' ? 'bg-slate-50 border-slate-100' : (isBlue ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100')}`}>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-2">
                {mode === 'PLAYER' ? (
                  <div className="w-20 shrink-0"><input type="number" placeholder="N°" className={`w-full px-2 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none text-center font-black text-slate-800 text-sm`} value={newNumber} onChange={(e) => setNewNumber(e.target.value)} /></div>
                ) : (
                  <div className="flex-1 relative"><ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} /><input list={`staff-roles-${accentColor}`} placeholder="Ruolo..." className={`w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none font-black text-slate-700 text-[11px] uppercase placeholder:font-normal`} value={newRole} onChange={(e) => setNewRole(e.target.value)} /><datalist id={`staff-roles-${accentColor}`}>{PREDEFINED_STAFF_ROLES.map(r => <option key={r} value={r} />)}</datalist></div>
                )}
                <div className="flex-1"><input type="text" placeholder={t.lastName} className={`w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none font-black text-slate-800 uppercase text-sm`} value={newLastName} onChange={(e) => setNewLastName(e.target.value.toUpperCase())} /></div>
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder={t.firstName} className={`flex-1 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${ringColor} outline-none font-black text-slate-800 uppercase text-sm`} value={newFirstName} onChange={(e) => setNewFirstName(e.target.value.toUpperCase())} />
                <div className="flex gap-2">
                  {editingId && <button onClick={cancelEdit} className="w-12 h-[45px] bg-slate-200 text-slate-500 flex items-center justify-center rounded-xl transition-all active:scale-95"><X size={18} /></button>}
                  <button onClick={handleAddOrUpdate} className={`w-14 h-[45px] ${editingId ? 'bg-amber-500' : btnColor} text-white flex items-center justify-center rounded-xl transition-all shadow-md active:scale-95`}>{editingId ? <Check size={22} /> : <UserPlus size={18} />}</button>
                </div>
              </div>
            </div>
          </div>

          {mode === 'PLAYER' && availableFromRegistry.length > 0 && !editingId && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5 px-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Users size={10} /> Suggeriti</label><button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-[8px] font-black text-blue-600 uppercase">{showQuickAdd ? 'Chiudi' : 'Vedi Tutti'}</button></div>
              <div className={`overflow-x-auto py-1 no-scrollbar flex items-center gap-2 ${showQuickAdd ? 'flex-wrap' : ''}`}>{availableFromRegistry.map((ap, idx) => { if (!showQuickAdd && idx > 8) return null; return (<button key={ap.id} onClick={() => handleQuickAddPlayer(ap)} className="shrink-0 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-lg py-1.5 px-2.5 hover:bg-blue-50 transition-all group min-w-[50px] shadow-sm"><span className="text-[10px] font-black text-slate-700 group-hover:text-blue-600">{ap.number}</span><span className="text-[6px] font-bold text-slate-400 uppercase truncate w-full text-center">{ap.lastName.split(' ')[0]}</span></button>); })}</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar space-y-4">
            {staff.length > 0 && (
              <div className="space-y-1.5"><h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1"><UserCog size={10} /> Area Tecnica</h4>{staff.map(s => { const isEditing = editingId === s.id; return (<div key={s.id} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isEditing ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-white'}`}><div className="flex items-center gap-3 min-w-0"><div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isBlue ? 'border-blue-100 text-blue-600' : 'border-red-100 text-red-600'} bg-white`}>{s.role?.toUpperCase().includes("ALLENATORE") ? <Star size={14} fill="currentColor" /> : <Shield size={14} />}</div><div className="flex flex-col min-w-0"><span className="font-black text-slate-800 uppercase text-xs truncate leading-none mb-0.5">{s.lastName}</span><span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded inline-block w-fit ${isBlue ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{s.role}</span></div></div><div className="flex items-center"><button onClick={() => startEdit(s, 'STAFF')} className={`p-2 transition-colors ${isEditing ? 'text-amber-600' : 'text-slate-300 hover:text-blue-500'}`}><Pencil size={16} /></button><button onClick={() => removeStaff(s.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16} /></button></div></div>); })}</div>
            )}
            <div className="space-y-1.5">
              <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1"><Users size={10} /> Atleti Convocati</h4>
              {roster.length === 0 ? (<div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30"><p className="text-slate-300 text-[8px] font-black uppercase">Nessun Atleta</p></div>) : ([...roster].reverse().map(player => { const isEditing = editingId === player.id; return (<div key={player.id} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isEditing ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400' : 'border-slate-100 bg-white hover:bg-slate-50'}`}><div className="flex items-center gap-3 min-w-0"><span className={`flex items-center justify-center w-8 h-8 ${isBlue ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'} rounded-lg font-black text-sm border shrink-0`}>{player.number}</span><div className="flex flex-col min-w-0"><span className="font-black text-slate-800 uppercase text-xs leading-none truncate mb-0.5">{player.lastName}</span>{player.roles && player.roles.length > 0 && player.roles[0] !== HandballRole.ND && (<span className="text-[6px] font-black bg-slate-100 text-slate-500 px-1 rounded uppercase w-fit">{player.roles[0]}</span>)}</div></div><div className="flex items-center"><button onClick={() => startEdit(player, 'PLAYER')} className={`p-2 transition-colors ${isEditing ? 'text-amber-600' : 'text-slate-300 hover:text-blue-500'}`}><Pencil size={16} /></button><button onClick={() => removePlayer(player.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={16} /></button></div></div>); }))}
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
             <h4 className="flex items-center gap-2 text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1.5"><Info size={12}/> Guida Setup Roster</h4>
             <p className="text-[8px] text-blue-600 font-medium leading-relaxed">
               1. Inserisci il <strong>Numero Maglia</strong>: se presente in anagrafica i dati verranno pre-caricati. 2. Definisci i <strong>Ruoli</strong> specifici per migliorare il referto finale. 3. Usa <strong>Area Tecnica</strong> per registrare allenatori e dirigenti (obbligatorio Ufficiale A). 4. Clicca sulla <Pencil size={8} className="inline"/> per modificare dati già inseriti.
             </p>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className={`p-6 text-white flex justify-between items-center ${isBlue ? 'bg-blue-600' : 'bg-red-600'}`}><div><h3 className="font-black uppercase tracking-widest text-sm">Importa da Anagrafica</h3><p className="text-[10px] font-bold opacity-70">Seleziona il team e gli atleti per questa gara</p></div><button onClick={() => setShowImportModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors"><X size={20} /></button></div>
            
            <div className="p-5 space-y-4 flex-1 flex flex-col min-h-0">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Layers size={10} /> Seleziona Database Team</label>
                 <div className="relative">
                    <select 
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      value={selectedRegistryIndex}
                      onChange={(e) => {
                        setSelectedRegistryIndex(parseInt(e.target.value));
                        setSelectedInModal(new Set());
                      }}
                    >
                      {allRegistries.map((reg, idx) => (
                        <option key={idx} value={idx}>{reg.category} - {reg.teamName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                 </div>
              </div>

              <button onClick={() => confirmModalImport(true)} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-lg border-2 border-transparent hover:scale-[1.02] active:scale-95 mb-2 ${isBlue ? 'bg-blue-900 text-white shadow-blue-100' : 'bg-red-900 text-white shadow-red-100'}`}><Zap size={18} className="text-amber-400 fill-amber-400" /> Importa Tutto il Team (Atleti + Staff)</button>
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Cerca per cognome o numero..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={modalSearch} onChange={e => setModalSearch(e.target.value)} /></div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                <div onClick={() => setImportStaff(!importStaff)} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${importStaff ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-white'}`}><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${importStaff ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}><UserCog size={18} /></div><div><p className="text-xs font-black uppercase text-slate-800 leading-tight">Area Tecnica</p><p className="text-[9px] font-medium text-slate-500">Includi 1° e 2° Allenatore salvati</p></div></div><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${importStaff ? 'bg-amber-400 border-amber-400' : 'border-slate-200'}`}>{importStaff && <Check size={12} className="text-white" />}</div></div>
                <div className="h-px bg-slate-100 my-2"></div>
                {filteredRegistryForModal.map(p => (<div key={p.id} onClick={() => setSelectedInModal(prev => { const next = new Set(prev); if (next.has(p.id)) next.delete(p.id); else next.add(p.id); return next; })} className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedInModal.has(p.id) ? (isBlue ? 'border-blue-400 bg-blue-50' : 'border-red-400 bg-red-50') : 'border-slate-100 bg-white hover:border-slate-200'}`}><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedInModal.has(p.id) ? (isBlue ? 'bg-blue-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-100 text-slate-500'}`}>{p.number}</div><div><p className="text-xs font-black uppercase text-slate-800 leading-tight">{p.lastName}</p><p className="text-[10px] font-medium text-slate-400">{p.firstName}</p></div></div><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedInModal.has(p.id) ? (isBlue ? 'bg-blue-600 border-blue-600' : 'bg-red-600 border-red-600') : 'border-slate-200'}`}>{selectedInModal.has(p.id) && <Check size={12} className="text-white" />}</div></div>))}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-white border border-slate-200">Annulla</button>
              <button onClick={() => confirmModalImport(false)} disabled={selectedInModal.size === 0 && !importStaff} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg ${isBlue ? 'bg-blue-600' : 'bg-red-600'} disabled:opacity-50`}>Conferma ({selectedInModal.size + (importStaff ? 1 : 0)})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterSetup;
