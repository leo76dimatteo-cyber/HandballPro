
import React, { useState, useRef, useMemo } from 'react';
import { TeamProfile, Player, HandballRole, UserRole } from '../types';
import { Save, UserPlus, Trash2, Shield, UserCircle, Briefcase, AlertCircle, Layers, Lock, Unlock, Users, Hash, CheckCircle2, Star, UserCog, Upload, Image as ImageIcon, X, Info, Zap, Settings as SettingsIcon, Pencil, Check, Share2, Link as LinkIcon, ChevronLeft } from 'lucide-react';

const SUGGESTED_CATEGORIES = [
  "Serie A Gold", "Serie A Silver", "Serie A1 F", "Serie A2", "Serie B", 
  "Under 20", "Under 17", "Under 15", "Under 13", "Amichevole"
];

const ALL_ROLES = Object.values(HandballRole).filter(r => r !== HandballRole.ND);

interface TeamRegistryProps { 
  profile: TeamProfile; 
  onSave: (profile: TeamProfile) => void; 
  isAdmin?: boolean;
  userPin?: string;
  t?: any;
}

const TeamRegistry: React.FC<TeamRegistryProps> = ({ profile, onSave, isAdmin = false, userPin, t }) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'ROSTER'>('IDENTITY');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinEntry, setPinEntry] = useState('');

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [teamName, setTeamName] = useState(profile.teamName);
  const [coachName, setCoachName] = useState(profile.coachName);
  const [assistantCoachName, setAssistantCoachName] = useState(profile.assistantCoachName || '');
  const [category, setCategory] = useState(profile.category || "Serie B");
  const [players, setPlayers] = useState<Player[]>(profile.players);
  const [logo, setLogo] = useState<string | undefined>(profile.logo);

  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newNum, setNewNum] = useState('');
  const [newRoles, setNewRoles] = useState<HandballRole[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const nA = parseInt(a.number) || 0;
      const nB = parseInt(b.number) || 0;
      return nA - nB;
    });
  }, [players]);

  const toggleRole = (role: HandballRole, currentList: HandballRole[], setList: (l: HandballRole[]) => void) => {
    if (currentList.includes(role)) {
      setList(currentList.filter(r => r !== role));
    } else {
      setList([...currentList, role]);
    }
  };

  const handleShareInvite = async (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    
    const payload = btoa(JSON.stringify({
      role: UserRole.GUEST,
      society: teamName,
      inviter: coachName || 'Staff Tecnico'
    }));

    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${payload}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Accesso HandballPro - ${teamName}`,
          text: `Segui i progressi di ${player.lastName} e di tutto il team su HandballPro!`,
          url: inviteUrl
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        alert("Link di accesso Visualizzatore copiato negli appunti! Invialo ai contatti dell'atleta.");
      }
    } catch (err) {
      console.error("Errore condivisione", err);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        alert("L'immagine è troppo grande. Massimo 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (confirm("Rimuovere il logo della società?")) {
      setLogo(undefined);
    }
  };

  const addPlayer = () => {
    if (!isAdmin || !isUnlocked) return;
    
    if (!newFirst.trim() || !newLast.trim() || !newNum.trim()) {
      setErrorMsg("Tutti i campi (Numero, Cognome, Nome) sono obbligatori.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (players.some(p => p.number === newNum.trim())) {
      setErrorMsg(`Il numero ${newNum} è già assegnato a un altro giocatore.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const p: Player = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: newFirst.trim().toUpperCase(),
      lastName: newLast.trim().toUpperCase(),
      number: newNum.trim(),
      roles: newRoles.length > 0 ? newRoles : [HandballRole.ND]
    };

    setPlayers([...players, p]);
    setNewFirst('');
    setNewLast('');
    setNewNum('');
    setNewRoles([]);
    setErrorMsg(null);
    numInputRef.current?.focus();
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer || !isAdmin || !isUnlocked) return;

    if (!editingPlayer.firstName.trim() || !editingPlayer.lastName.trim() || !editingPlayer.number.trim()) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }

    if (players.some(p => p.number === editingPlayer.number.trim() && p.id !== editingPlayer.id)) {
      alert(`Il numero ${editingPlayer.number} è già assegnato a un altro giocatore.`);
      return;
    }

    setPlayers(players.map(p => p.id === editingPlayer.id ? {
      ...editingPlayer,
      firstName: editingPlayer.firstName.trim().toUpperCase(),
      lastName: editingPlayer.lastName.trim().toUpperCase(),
      number: editingPlayer.number.trim(),
      roles: editingPlayer.roles && editingPlayer.roles.length > 0 ? editingPlayer.roles : [HandballRole.ND]
    } : p));
    
    setEditingPlayer(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addPlayer();
  };

  const removePlayer = (e: React.MouseEvent, id: string) => { 
    e.stopPropagation();
    if (!isAdmin || !isUnlocked) return;
    if(confirm("Rimuovere definitivamente questo giocatore dall'anagrafica?")) {
      setPlayers(players.filter(p => p.id !== id)); 
    }
  };

  const handleSave = () => {
    if (!isAdmin || !isUnlocked) return;
    onSave({ teamName, coachName, assistantCoachName, category, players, logo });
  };

  const handlePinClick = (num: string) => {
    if (pinEntry.length < 4) {
      const nextPin = pinEntry + num;
      setPinEntry(nextPin);
      if (nextPin.length === 4) {
        const correctPin = userPin || '0000';
        if (nextPin === correctPin) {
          setIsUnlocked(true);
          setShowPinModal(false);
          setPinEntry('');
          setErrorMsg(null);
        } else {
          setErrorMsg("PIN ERRATO");
          setTimeout(() => {
             setErrorMsg(null);
             setPinEntry('');
          }, 1500);
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="relative">
            {logo ? (
              <img src={logo} alt="Logo Società" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain bg-slate-50 border-2 border-blue-50 shadow-md" />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-blue-400 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-100">
                <Shield size={32} />
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 p-1 rounded-full border-2 border-white text-white ${isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`}>
               {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
            </div>
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
              {teamName || 'Profilo Società'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">HandballPro 3.0</span>
               {isUnlocked ? (
                 <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><Unlock size={8} /> Sessione Sbloccata</span>
               ) : (
                 <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1"><Lock size={8} /> Protetto</span>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isUnlocked && isAdmin && (
            <button 
              onClick={() => setShowPinModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]"
            >
              <Lock size={20} />
              Sblocca Modifiche
            </button>
          )}

          {isUnlocked && isAdmin && (
            <button 
              onClick={handleSave}
              className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px]"
            >
              <Save size={20} />
              Salva Cambiamenti
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm mb-8 w-fit mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('IDENTITY')}
          className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'IDENTITY' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Info size={14} /> Identità & Staff
        </button>
        <button 
          onClick={() => setActiveTab('ROSTER')}
          className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ROSTER' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users size={14} /> Atleti ({players.length})
        </button>
      </div>

      <div className={`grid grid-cols-1 gap-8 transition-all ${(!isUnlocked && isAdmin) ? 'opacity-40 grayscale-[0.8] pointer-events-none' : ''}`}>
        {activeTab === 'IDENTITY' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                      <ImageIcon size={16} className="text-blue-500" />
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Logo Club</h3>
                   </div>
                   <div className="p-8 flex flex-col items-center">
                      <div 
                        onClick={() => isAdmin && isUnlocked && fileInputRef.current?.click()}
                        className={`relative w-40 h-40 bg-slate-50 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden ${logo ? 'border-blue-400' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}
                      >
                        {logo ? (
                          <img src={logo} className="w-full h-full object-contain p-4" alt="Preview" />
                        ) : (
                          <>
                            <Upload size={24} className="text-blue-400" />
                            <p className="text-[8px] font-black text-slate-400 uppercase">Carica Immagine</p>
                          </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoChange} />
                      </div>
                      {logo && isAdmin && isUnlocked && (
                        <button onClick={removeLogo} className="mt-4 text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                           <Trash2 size={12} /> Rimuovi Logo
                        </button>
                      )}
                      <p className="mt-6 text-center text-[10px] text-slate-400 font-medium px-4">Scegli un logo leggibile e quadrato.</p>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                      <SettingsIcon size={16} className="text-blue-500" />
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Dati Societari</h3>
                   </div>
                   <div className="p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Denominazione Ufficiale</label>
                        <input
                          type="text"
                          disabled={!isAdmin || !isUnlocked}
                          className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-900 transition-all uppercase placeholder:font-normal placeholder:text-slate-300 text-lg disabled:opacity-50"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value.toUpperCase())}
                          placeholder="ES: HANDBALL CLUB MILANO"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Categoria Default</label>
                            <input
                              list="registry-categories"
                              disabled={!isAdmin || !isUnlocked}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 transition-all uppercase disabled:opacity-50"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                            />
                            <datalist id="registry-categories">
                              {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                            </datalist>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  <h3 className="font-black uppercase tracking-widest text-[10px]">Database Atleti</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">
                    {players.length} Totali
                  </span>
                </div>
            </div>

            <div className="p-8">
              {isAdmin && isUnlocked && (
                <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 p-6 rounded-3xl border transition-all ${errorMsg ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest text-center">N°</label>
                    <input
                      ref={numInputRef}
                      type="number"
                      className="w-full px-3 py-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center font-black bg-white"
                      value={newNum}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewNum(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">Cognome</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black bg-white uppercase"
                      value={newLast}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewLast(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">Nome</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black bg-white uppercase"
                      value={newFirst}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => setNewFirst(e.target.value.toUpperCase())}
                    />
                  </div>
                  
                  <div className="md:col-span-10">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">Assegna Ruoli</label>
                    <div className="flex flex-wrap gap-2">
                       {ALL_ROLES.map(role => (
                         <button
                           key={role}
                           onClick={() => toggleRole(role, newRoles, setNewRoles)}
                           className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all flex items-center gap-1.5 ${newRoles.includes(role) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}
                         >
                           {role}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      onClick={addPlayer}
                      className="w-full h-[58px] bg-blue-600 text-white flex items-center justify-center rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                    >
                      <UserPlus size={24} />
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-24">N°</th>
                      <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Atleta / Ruoli</th>
                      <th className="px-8 py-5 text-right w-48">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-24 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <Users size={48} className="text-slate-100" />
                              <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Nessun atleta registrato</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      sortedPlayers.map((p) => (
                        <tr 
                          key={p.id} 
                          onClick={() => isAdmin && isUnlocked && setEditingPlayer(p)}
                          className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${editingPlayer?.id === p.id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-8 py-5 text-center">
                            <span className="font-black text-lg text-slate-900">{p.number}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 uppercase tracking-tight text-base leading-none mb-1">{p.lastName} {p.firstName}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {p.roles?.map(r => (
                                  <span key={r} className="text-[7px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 tracking-tighter">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Pulsante Condividi sempre sbloccato per gli admin */}
                              <button
                                onClick={(e) => handleShareInvite(e, p)}
                                className="p-3 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 bg-white pointer-events-auto"
                                title="Condividi link visualizzatore"
                              >
                                <Share2 size={18} />
                              </button>
                              
                              {isAdmin && isUnlocked && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingPlayer(p); }}
                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  <button
                                    onClick={(e) => removePlayer(e, p.id)}
                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PIN - NUMERIC KEYPAD */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-amber-500 p-8 text-center text-white relative">
                 <button onClick={() => setShowPinModal(false)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                    <X size={20} />
                 </button>
                 <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} />
                 </div>
                 <h3 className="font-black uppercase tracking-tight text-xl">Area Riservata</h3>
                 <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Inserisci PIN per sbloccare</p>
              </div>

              <div className="p-8">
                 <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pinEntry.length > i ? 'bg-amber-500 border-amber-500 scale-125' : 'border-slate-200'}`} 
                      />
                    ))}
                 </div>

                 {errorMsg && (
                   <div className="text-center mb-6 animate-bounce text-red-500 text-[10px] font-black uppercase tracking-widest">
                      {errorMsg}
                   </div>
                 )}

                 <div className="grid grid-cols-3 gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                      <button
                        key={btn}
                        onClick={() => {
                          if (btn === 'C') setPinEntry('');
                          else if (btn === '⌫') setPinEntry(prev => prev.slice(0, -1));
                          else if (btn !== 'C' && btn !== '⌫') handlePinClick(btn);
                        }}
                        className={`h-16 rounded-2xl font-black text-xl transition-all active:scale-95 flex items-center justify-center ${
                          btn === 'C' ? 'bg-red-50 text-red-500 text-sm' : 
                          btn === '⌫' ? 'bg-slate-50 text-slate-400' : 
                          'bg-slate-50 text-slate-900 hover:bg-slate-100 shadow-sm border border-slate-100'
                        }`}
                      >
                         {btn}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL MODIFICA ATLETA */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[550] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
                <div>
                   <h3 className="font-black uppercase tracking-tight text-xl">Modifica Atleta</h3>
                </div>
                <button onClick={() => setEditingPlayer(null)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30">
                   <X size={24} />
                </button>
             </div>
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">N°</label>
                    <input 
                       type="number"
                       className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 text-center text-lg"
                       value={editingPlayer.number}
                       onChange={e => setEditingPlayer({...editingPlayer, number: e.target.value})}
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cognome</label>
                    <input 
                       type="text"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 uppercase"
                       value={editingPlayer.lastName}
                       onChange={e => setEditingPlayer({...editingPlayer, lastName: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome</label>
                   <input 
                      type="text"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 uppercase"
                      value={editingPlayer.firstName}
                      onChange={e => setEditingPlayer({...editingPlayer, firstName: e.target.value.toUpperCase()})}
                   />
                </div>
                <div className="pt-4 flex gap-4">
                   <button 
                      onClick={() => setEditingPlayer(null)}
                      className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100"
                   >
                      Annulla
                   </button>
                   <button 
                      onClick={handleUpdatePlayer}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                      <CheckCircle2 size={18} /> Salva Modifiche
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamRegistry;