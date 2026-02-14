
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Language, TeamProfile } from '../types';
import { storage } from '../services/storageService';
import TeamRegistry from './TeamRegistry';
import { User, Shield, Database, Download, Upload, Trash2, Check, X, LogOut, Key, Languages, Users, Settings as SettingsIcon, Lock, Plus, Layers, Star, UserPlus as InviteIcon, Link as LinkIcon, Share2, CheckCircle2, AlertCircle, Info as InfoIcon, ChevronDown, Copy, Smartphone, Monitor, RefreshCw, Briefcase, BookOpen, HelpCircle, Zap, CloudUpload, CloudDownload, Trophy, Activity, FileText, Layout, Dumbbell } from 'lucide-react';

interface SettingsProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onBack: () => void;
  t: any;
  onLangChange: (lang: Language) => void;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

interface FeedbackState {
  show: boolean;
  message: string;
  subMessage?: string;
  type: 'success' | 'error' | 'info';
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onBack, t, onLangChange, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'REGISTRY' | 'GUIDE'>('GENERAL');
  const [editUser, setEditUser] = useState<UserProfile>(user);
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.OFFICIAL);
  const [invitePosition, setInvitePosition] = useState('');
  const [importId, setImportId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Security pull modal state
  const [showPullPinModal, setShowPullPinModal] = useState(false);
  const [pullPinEntry, setPullPinEntry] = useState('');
  const [pullPinError, setPullPinError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>({
    show: false,
    message: '',
    type: 'success'
  });

  const triggerFeedback = (message: string, subMessage?: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ show: true, message, subMessage, type });
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  const [allRegistries, setAllRegistries] = useState<TeamProfile[]>(() => storage.getAllRegistries());
  const [currentRegIndex, setCurrentRegIndex] = useState(0);

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    category: '',
    teamName: user.society || '',
    coachName: `${user.lastName} ${user.firstName}`
  });

  const handleSaveProfile = () => {
    storage.setUser(editUser);
    onUpdateUser(editUser);
    triggerFeedback(
      t.saveProfile, 
      `${t.settings} per ${editUser.society || 'il tuo club'} salvate.`
    );
  };

  const handlePushToCloud = async () => {
    if (!editUser.pin) {
      onNotify("Imposta un PIN di sicurezza prima di sincronizzare", "error");
      return;
    }
    setIsSyncing(true);
    const result = await storage.pushToCloud(user.id);
    setIsSyncing(false);
    if (result.success) {
      const now = Date.now();
      const updatedUser = { ...user, lastSync: now };
      storage.setUser(updatedUser);
      onUpdateUser(updatedUser);
      triggerFeedback("Sincronizzazione Riuscita", "Dati caricati sul cloud. Ora puoi scaricarli su altri dispositivi usando il tuo ID e PIN.", "success");
    } else {
      onNotify(result.error || "Errore durante l'upload dei dati", "error");
    }
  };

  const handleRequestPull = () => {
    if (!importId.trim()) {
      onNotify("Inserisci un ID sorgente valido", "error");
      return;
    }
    setPullPinEntry('');
    setShowPullPinModal(true);
  };

  const handlePullPinClick = async (num: string) => {
    if (pullPinEntry.length < 4) {
      const nextPin = pullPinEntry + num;
      setPullPinEntry(nextPin);
      if (nextPin.length === 4) {
        setIsSyncing(true);
        const result = await storage.pullFromCloud(importId, nextPin);
        setIsSyncing(false);
        
        if (result.success) {
          setShowPullPinModal(false);
          triggerFeedback("Ripristino Riuscito", "Dati scaricati con successo. L'app verrà ricaricata per applicare le modifiche.", "success");
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setPullPinError(result.error || "PIN Errato");
          setTimeout(() => {
            setPullPinError(null);
            setPullPinEntry('');
          }, 1500);
        }
      }
    }
  };

  const handleSaveRegistry = (newProfile: TeamProfile) => {
    storage.saveRegistry(newProfile);
    const updated = storage.getAllRegistries();
    setAllRegistries(updated);
    triggerFeedback(
      t.registry, 
      `${t.category} ${newProfile.category} sincronizzata.`,
      "success"
    );
  };

  const handleConfirmAddTeam = () => {
    const { category, teamName, coachName } = newTeamData;
    if (!category.trim() || !teamName.trim()) {
      onNotify("Campi obbligatori mancanti", "error");
      return;
    }
    if (allRegistries.some(r => r.category.toUpperCase() === category.trim().toUpperCase())) {
      onNotify("Categoria già esistente", "error");
      return;
    }

    const newTeam: TeamProfile = {
      teamName: teamName.toUpperCase(),
      coachName: coachName.toUpperCase(),
      category: category.trim(),
      players: []
    };
    
    storage.saveRegistry(newTeam);
    const updated = storage.getAllRegistries();
    setAllRegistries(updated);
    setCurrentRegIndex(updated.length - 1);
    setShowAddTeamModal(false);
    setNewTeamData({ category: '', teamName: user.society || '', coachName: `${user.lastName} ${user.firstName}` });
    triggerFeedback(t.newCategory, "");
  };

  const handleDeleteTeam = (category: string) => {
    if (confirm(`Eliminare il database per ${category}?`)) {
      storage.deleteRegistry(category);
      const updated = storage.getAllRegistries();
      setAllRegistries(updated);
      setCurrentRegIndex(0);
      triggerFeedback(t.delete, "", "info");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await storage.importAll(file);
      if (ok) {
        triggerFeedback(t.import, "L'app verrà ricaricata.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        triggerFeedback(t.import, "File non valido.", "error");
      }
    }
  };

  const handleReset = () => {
    if (confirm(t.confirmResetMatch)) {
      storage.clearAll();
      window.location.reload();
    }
  };

  const handleGenerateInvite = async () => {
    const payload = btoa(JSON.stringify({
      role: inviteRole,
      society: user.society,
      position: invitePosition,
      inviter: `${user.lastName} ${user.firstName}`
    }));

    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${payload}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invito Collaboratore - ${user.society}`,
          text: `Unisciti al team ${user.society} su HandballPro come ${invitePosition || (inviteRole === UserRole.OFFICIAL ? t.editorRole : t.viewerRole)}!`,
          url: inviteUrl
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        onNotify(t.linkCopied, "success");
      }
    } catch (err) {
      console.error("Errore condivisione", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 animate-in fade-in duration-500 pb-20 relative">
      
      {feedback.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4 animate-in slide-in-from-top-10 duration-500">
           <div className={`p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 backdrop-blur-md flex items-start gap-4 ${
             feedback.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 
             feedback.type === 'error' ? 'bg-red-600 border-red-400 text-white' : 
             'bg-blue-600 border-blue-400 text-white'
           }`}>
              <div className="bg-white/20 p-2.5 rounded-2xl shrink-0">
                 {feedback.type === 'success' && <CheckCircle2 size={24} />}
                 {feedback.type === 'error' && <AlertCircle size={24} />}
                 {feedback.type === 'info' && <InfoIcon size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="font-black uppercase tracking-tight text-base leading-tight">{feedback.message}</h4>
                 <p className="text-[11px] font-bold opacity-80 uppercase tracking-widest mt-1 leading-relaxed">
                   {feedback.subMessage}
                 </p>
              </div>
              <button 
                onClick={() => setFeedback(prev => ({ ...prev, show: false }))}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{t.settings}</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Configurazione sistema e database team</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'GENERAL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.general}
          </button>
          <button 
            onClick={() => setActiveTab('REGISTRY')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'REGISTRY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.registry}
          </button>
          <button 
            onClick={() => setActiveTab('GUIDE')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'GUIDE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BookOpen size={14} className="inline mr-1" /> {t.guide}
          </button>
        </div>
      </div>

      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 flex items-center gap-3">
              <User className="text-blue-400" size={20} />
              <h3 className="text-white font-black uppercase tracking-widest text-xs">{t.userInfo}</h3>
            </div>
            <div className="p-6 md:p-8 space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.firstName}</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editUser.firstName}
                    onChange={e => setEditUser({...editUser, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.lastName}</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editUser.lastName}
                    onChange={e => setEditUser({...editUser, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t.homeTeam}</label>
                <input 
                  type="text" 
                  placeholder="ES: HANDBALL CLUB"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.society}
                  onChange={e => setEditUser({...editUser, society: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                    <Briefcase size={12} className="text-blue-500" /> {t.techQual}
                  </label>
                  <input 
                    type="text" 
                    placeholder="ES: ALLENATORE"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                    value={editUser.position || ''}
                    onChange={e => setEditUser({...editUser, position: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                    <Shield size={12} className="text-blue-500" /> {t.accessLevel}
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editUser.role}
                    onChange={e => setEditUser({...editUser, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.ADMIN}>{t.adminRole}</option>
                    <option value={UserRole.OFFICIAL}>{t.officialRole}</option>
                    <option value={UserRole.GUEST}>{t.guestRole}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                  <Lock size={12} className="text-amber-500" /> {t.securityPin}
                </label>
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Imposta PIN a 4 cifre"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 tracking-[0.5em]"
                  value={editUser.pin || ''}
                  onChange={e => setEditUser({...editUser, pin: e.target.value.replace(/\D/g, '')})}
                />
              </div>
              
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-2">
                  <Languages size={14} className="text-blue-500" /> {t.language}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['it', 'en', 'fr', 'de', 'es'] as Language[]).map(l => (
                    <button 
                      key={l}
                      onClick={() => {
                        onLangChange(l);
                        setEditUser({...editUser, language: l});
                      }}
                      className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${editUser.language === l ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                <Check size={18} /> {t.saveProfile}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-emerald-600 p-6 flex items-center gap-3 text-white">
                <Smartphone size={20} />
                <h3 className="font-black uppercase tracking-widest text-xs">{t.multiDevice} (Cloud Sync)</h3>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.personalId}</p>
                  <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <code className="flex-1 font-mono font-black text-blue-600 truncate">{user.id}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(user.id);
                        onNotify(t.linkCopied, "success");
                      }}
                      className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {user.lastSync && (
                    <p className="text-[8px] font-bold text-emerald-600 uppercase text-right">Ultimo Upload: {new Date(user.lastSync).toLocaleString()}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    disabled={isSyncing}
                    onClick={handlePushToCloud}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700 active:scale-95'}`}
                  >
                    {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                    Sincronizza sul Cloud
                  </button>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carica Dati da Altro ID</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Incolla l'ID Sorgente"
                      className="flex-1 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:font-normal"
                      value={importId}
                      onChange={e => setImportId(e.target.value.toUpperCase())}
                    />
                    <button 
                      disabled={isSyncing}
                      onClick={handleRequestPull}
                      className={`p-4 rounded-2xl flex items-center justify-center transition-all shadow-md ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
                    >
                       {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudDownload size={20} />}
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-400 font-medium leading-relaxed px-1">
                    Attenzione: il ripristino sovrascriverà tutti i dati locali. È richiesto il PIN di sicurezza dell'ID sorgente.
                  </p>
                </div>
              </div>
            </div>

            {user.role === UserRole.ADMIN && (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-blue-600 p-6 flex items-center gap-3 text-white">
                  <InviteIcon size={20} />
                  <h3 className="font-black uppercase tracking-widest text-xs">{t.inviteTitle}</h3>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Briefcase size={12} className="text-blue-500" /> {t.techQual}</label>
                      <input 
                        type="text"
                        placeholder="EX: Allenatore in seconda, Manager, etc."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={invitePosition}
                        onChange={e => setInvitePosition(e.target.value)}
                      />
                   </div>
                   <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex">
                      <button onClick={() => setInviteRole(UserRole.OFFICIAL)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${inviteRole === UserRole.OFFICIAL ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>{t.editorRole}</button>
                      <button onClick={() => setInviteRole(UserRole.GUEST)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${inviteRole === UserRole.GUEST ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>{t.viewerRole}</button>
                   </div>
                   <button onClick={handleGenerateInvite} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"><LinkIcon size={18} className="text-blue-400" /> {t.generateLink}</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-100 p-6 flex items-center gap-3">
                <Database className="text-slate-400" size={20} />
                <h3 className="text-slate-600 font-black uppercase tracking-widest text-xs">{t.dataManagement}</h3>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                <button onClick={() => { storage.exportAll(); onNotify(t.export + " Riuscito"); }} className="w-full bg-white border border-slate-200 hover:border-blue-500 text-slate-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                  <Download size={16} className="text-blue-500" /> {t.export} Backup
                </button>
                <label className="w-full bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer">
                  <Upload size={16} className="text-emerald-500" /> {t.import} Backup
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
                <button onClick={handleReset} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-100">
                  <Trash2 size={16} className="inline mr-2" /> {t.resetApp}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'REGISTRY' && (
        <div className="space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><Users size={20} /></div>
            <div className="flex-1 w-full space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.selectTeamCat}</label>
               <div className="relative">
                  <select 
                    value={currentRegIndex}
                    onChange={(e) => setCurrentRegIndex(parseInt(e.target.value))}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-800 text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    {allRegistries.length === 0 ? (
                      <option disabled>Nessun team configurato</option>
                    ) : (
                      allRegistries.map((reg, idx) => (
                        <option key={idx} value={idx}>{reg.category} - {reg.teamName}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={20} /></div>
               </div>
            </div>
            <button onClick={() => setShowAddTeamModal(true)} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><Plus size={20} /> {t.newCategory}</button>
          </div>

          {allRegistries.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
              <TeamRegistry profile={allRegistries[currentRegIndex]} onSave={handleSaveRegistry} isAdmin={user.role === UserRole.ADMIN || user.role === UserRole.OFFICIAL} userPin={user.pin} t={t} />
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => handleDeleteTeam(allRegistries[currentRegIndex].category)} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-2"><Trash2 size={14} /> Elimina Database {allRegistries[currentRegIndex].category}</button>
              </div>
            </div>
          ) : (
            <div className="py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Users size={48} /></div>
                <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nessun Team</h3><p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mt-1">Crea un'anagrafica per gestire i tuoi convocati.</p></div>
                <button onClick={() => setShowAddTeamModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"><Plus size={18} /> Crea Primo Team</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'GUIDE' && (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
           <div className="bg-white p-6 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-12">
                 <div className="bg-blue-600 p-4 rounded-[2rem] text-white shadow-xl shadow-blue-100"><BookOpen size={36} /></div>
                 <div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Manuale Operativo</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Guida professionale alla configurazione</p>
                 </div>
              </div>

              <div className="space-y-12">
                 {/* 1. ANAGRAFICA */}
                 <section className="relative pl-12 border-l-2 border-blue-100">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">1</div>
                    <div className="flex items-center gap-2 mb-4">
                       <Users className="text-blue-600" size={20} />
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Anagrafica & Sicurezza</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                       <p className="text-sm text-slate-600 leading-relaxed">
                         Il Database è protetto dal <strong>PIN Allenatore</strong> (impostabile nei settaggi). Senza PIN, i dati sono in sola lettura per evitare modifiche accidentali da parte di collaboratori o durante la consultazione rapida.
                       </p>
                       <ul className="text-xs font-bold text-slate-500 uppercase tracking-wide list-disc pl-4 space-y-1">
                          <li>Sblocca con PIN per aggiungere/rimuovere atleti.</li>
                          <li>Carica il Logo del club per referti professionali.</li>
                          <li>Assegna Ruoli specifici per migliorare l'analisi AI.</li>
                       </ul>
                    </div>
                 </section>

                 {/* 2. MATCH CONSOLE */}
                 <section className="relative pl-12 border-l-2 border-amber-100">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">2</div>
                    <div className="flex items-center gap-2 mb-4">
                       <Activity className="text-amber-500" size={20} />
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Match Console & 2 Minuti</h3>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-3">
                       <p className="text-sm text-slate-600 leading-relaxed">
                         Durante la gara, seleziona un giocatore e assegna l'evento. 
                         <strong>Novità 2 Minuti:</strong> Quando un giocatore riceve una sospensione, il suo tasto diventa <span className="text-amber-700 font-bold">ARANCIONE</span>.
                       </p>
                       <div className="bg-white/50 p-3 rounded-xl border border-amber-200">
                          <p className="text-xs text-amber-800 font-medium">
                            Il giocatore sospeso viene bloccato e non può essere selezionato per gol o parate. Un timer a scalare appare sul tasto; allo scadere dei 120s il giocatore torna automaticamente attivo.
                          </p>
                       </div>
                    </div>
                 </section>

                 {/* 3. REFERTI AI */}
                 <section className="relative pl-12 border-l-2 border-emerald-100">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">3</div>
                    <div className="flex items-center gap-2 mb-4">
                       <FileText className="text-emerald-600" size={20} />
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Referti Generati con AI</h3>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-3">
                       <p className="text-sm text-slate-600 leading-relaxed">
                         Al termine del match, l'intelligenza artificiale (Gemini) analizza la cronologia degli eventi per scrivere un referto giornalistico.
                       </p>
                       <ul className="text-xs font-bold text-emerald-700 uppercase list-none space-y-2">
                          <li className="flex items-center gap-2"><Zap size={10}/> Identificazione MVP e migliori marcatori</li>
                          <li className="flex items-center gap-2"><Zap size={10}/> Analisi precisione tiri e palle perse</li>
                          <li className="flex items-center gap-2"><Zap size={10}/> Commento tattico sull'andamento del match</li>
                       </ul>
                    </div>
                 </section>

                 {/* 4. SYNC MULTI-DEVICE */}
                 <section className="relative pl-12 border-l-2 border-blue-100">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">4</div>
                    <div className="flex items-center gap-2 mb-4">
                       <Smartphone className="text-blue-900" size={20} />
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sincronizzazione PC - Tablet</h3>
                    </div>
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
                       <p className="text-sm opacity-80">
                         Per spostare i dati tra dispositivi (es. da PC a Tablet):
                       </p>
                       <ol className="text-xs font-black uppercase tracking-widest space-y-3 list-decimal pl-4">
                          <li className="text-emerald-400">Su PC: Clicca "Sincronizza sul Cloud" (Upload).</li>
                          <li className="text-blue-300">Copia il tuo "ID Personale".</li>
                          <li className="text-amber-400">Su Tablet: Incolla l'ID e clicca l'icona Download. <strong>Richiede il PIN sorgente.</strong></li>
                       </ol>
                       <p className="text-[9px] opacity-50 uppercase italic font-medium pt-2">
                         Nota: Il database locale del tablet verrà sovrascritto con quello del PC.
                       </p>
                    </div>
                 </section>

                 {/* 5. TRAINING LAB */}
                 <section className="relative pl-12 border-l-2 border-emerald-100">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-emerald-400 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">5</div>
                    <div className="flex items-center gap-2 mb-4">
                       <Dumbbell className="text-emerald-500" size={20} />
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Training Lab & Presenze</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                       <p className="text-sm text-slate-600 leading-relaxed">
                         Gestisci il registro allenamenti in tre step:
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-white rounded-xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Appello</p><p className="text-[9px] font-bold">Monitora presenze e ritardi.</p></div>
                          <div className="p-3 bg-white rounded-xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Rating</p><p className="text-[9px] font-bold">Valuta l'intensità (da 1 a 5 stelle).</p></div>
                          <div className="p-3 bg-white rounded-xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Workouts</p><p className="text-[9px] font-bold">Assegna esercizi individuali.</p></div>
                       </div>
                    </div>
                 </section>

                 {/* 6. TACTICAL BOARD */}
                 <section className="relative pl-12 border-l-2 border-slate-200">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">6</div>
                    <div className="flex items-center gap-2 mb-4">
                       <Layout className="text-slate-800" size={20} />
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lavagna Tattica</h3>
                    </div>
                    <div className="bg-slate-800 text-slate-300 p-6 rounded-2xl border border-slate-700 space-y-3">
                       <p className="text-sm leading-relaxed">
                         Strumento per spiegare schemi e movimenti. 
                       </p>
                       <ul className="text-xs font-bold uppercase tracking-widest list-none space-y-2">
                          <li>• <strong>Campo Intero / Metà:</strong> Adatta la visuale alla zona di gioco.</li>
                          <li>• <strong>Marker:</strong> Posiziona pedine numerate per i giocatori.</li>
                          <li>• <strong>Export:</strong> Salva lo schema come immagine per condividerlo su WhatsApp.</li>
                       </ul>
                    </div>
                 </section>
              </div>

              <div className="mt-16 pt-12 border-t border-slate-100 text-center">
                 <button 
                   onClick={() => setActiveTab('GENERAL')} 
                   className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl"
                 >
                   Torna alle Impostazioni
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL PIN PER CLOUD PULL */}
      {showPullPinModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-blue-600 p-8 text-center text-white relative">
                 <button onClick={() => setShowPullPinModal(false)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                    <X size={20} />
                 </button>
                 <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <CloudDownload size={32} />
                 </div>
                 <h3 className="font-black uppercase tracking-tight text-xl">Recupero Cloud</h3>
                 <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Inserisci PIN dell'ID: {importId}</p>
              </div>

              <div className="p-8">
                 <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pullPinEntry.length > i ? 'bg-blue-500 border-blue-500 scale-125' : 'border-slate-200'}`} 
                      />
                    ))}
                 </div>

                 {pullPinError && (
                   <div className="text-center mb-6 animate-bounce text-red-500 text-[10px] font-black uppercase tracking-widest">
                      {pullPinError}
                   </div>
                 )}

                 <div className="grid grid-cols-3 gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                      <button
                        key={btn}
                        disabled={isSyncing}
                        onClick={() => {
                          if (btn === 'C') setPullPinEntry('');
                          else if (btn === '⌫') setPullPinEntry(prev => prev.slice(0, -1));
                          else if (btn !== 'C' && btn !== '⌫') handlePullPinClick(btn);
                        }}
                        className={`h-16 rounded-2xl font-black text-xl transition-all active:scale-95 flex items-center justify-center ${
                          btn === 'C' ? 'bg-red-50 text-red-500 text-sm' : 
                          btn === '⌫' ? 'bg-slate-50 text-slate-400' : 
                          'bg-slate-50 text-slate-900 hover:bg-slate-100 shadow-sm border border-slate-100'
                        } ${isSyncing ? 'opacity-50' : ''}`}
                      >
                         {isSyncing && btn === '0' ? <RefreshCw size={24} className="animate-spin" /> : btn}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAddTeamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
                 <div>
                    <h3 className="font-black uppercase tracking-tight text-xl">{t.newCategory}</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Inizializzazione database team</p>
                 </div>
                 <button onClick={() => setShowAddTeamModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Layers size={14} className="text-emerald-500" /> {t.category}</label>
                    <input type="text" autoFocus className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newTeamData.category} onChange={e => setNewTeamData({...newTeamData, category: e.target.value})} placeholder="ES: UNDER 17" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Shield size={14} className="text-emerald-500" /> {t.homeTeam}</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newTeamData.teamName} onChange={e => setNewTeamData({...newTeamData, teamName: e.target.value.toUpperCase()})} placeholder="NOME CLUB" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Star size={14} className="text-emerald-500" /> 1° {t.staff}</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700" value={newTeamData.coachName} onChange={e => setNewTeamData({...newTeamData, coachName: e.target.value.toUpperCase()})} placeholder="NOME ALLENATORE" />
                 </div>
                 <div className="pt-4 flex gap-4">
                    <button onClick={() => setShowAddTeamModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100">{t.decline}</button>
                    <button onClick={handleConfirmAddTeam} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">{t.confirm}</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
