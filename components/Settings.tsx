
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Language, TeamProfile } from '../types';
import { storage } from '../services/storageService';
import TeamRegistry from './TeamRegistry';
// Alias UserPlus as InviteIcon to resolve the 'Cannot find name InviteIcon' error.
import { User, Shield, Database, Download, Upload, Trash2, Check, X, LogOut, Key, Languages, Users, Settings as SettingsIcon, Lock, Plus, Layers, Star, UserPlus as InviteIcon, Link as LinkIcon, Share2, CheckCircle2, AlertCircle, Info as InfoIcon } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'REGISTRY'>('GENERAL');
  const [editUser, setEditUser] = useState<UserProfile>(user);
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.OFFICIAL);
  
  // Local high-visibility feedback state
  const [feedback, setFeedback] = useState<FeedbackState>({
    show: false,
    message: '',
    type: 'success'
  });

  const triggerFeedback = (message: string, subMessage?: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ show: true, message, subMessage, type });
    // Persistence: 5 seconds for critical settings feedback
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  // Gestione Multi-Squadra
  const [allRegistries, setAllRegistries] = useState<TeamProfile[]>(() => storage.getAllRegistries());
  const [currentRegIndex, setCurrentRegIndex] = useState(0);

  // Form Nuova Squadra
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
      "Profilo Aggiornato", 
      `Le impostazioni per ${editUser.society || 'la tua società'} sono state salvate con successo.`
    );
  };

  const handleGenerateInvite = async () => {
    if (!user.society) {
      onNotify("Imposta prima il nome della società nel profilo", "error");
      return;
    }

    const payload = btoa(JSON.stringify({
      role: inviteRole,
      society: user.society,
      inviter: `${user.lastName} ${user.firstName}`
    }));

    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${payload}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Invito HandballPro',
          text: `Unisciti al team ${user.society} su HandballPro come ${inviteRole === UserRole.OFFICIAL ? 'Editor' : 'Visualizzatore'}!`,
          url: inviteUrl
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        triggerFeedback("Link Copiato", "Invia l'URL ai tuoi collaboratori per configurarli istantaneamente.", "info");
      }
    } catch (err) {
      console.error("Errore condivisione", err);
    }
  };

  const handleSaveRegistry = (newProfile: TeamProfile) => {
    storage.saveRegistry(newProfile);
    const updated = storage.getAllRegistries();
    setAllRegistries(updated);
    triggerFeedback(
      "Anagrafica Sincronizzata", 
      `Database per categoria ${newProfile.category} aggiornato correttamente.`,
      "success"
    );
  };

  const handleConfirmAddTeam = () => {
    const { category, teamName, coachName } = newTeamData;
    if (!category.trim() || !teamName.trim()) {
      onNotify("Compila i campi obbligatori", "error");
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
    triggerFeedback("Nuova Squadra Creata", `Categoria ${category} aggiunta con successo all'anagrafica.`);
  };

  const handleDeleteTeam = (category: string) => {
    if (confirm(`Sei sicuro di voler eliminare definitivamente il database per ${category}?`)) {
      storage.deleteRegistry(category);
      const updated = storage.getAllRegistries();
      setAllRegistries(updated);
      setCurrentRegIndex(0);
      triggerFeedback("Database Rimosso", `I dati per la categoria ${category} sono stati eliminati.`, "info");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await storage.importAll(file);
      if (ok) {
        triggerFeedback("Backup Importato", "Il sistema è stato ripristinato. L'app verrà ricaricata.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        triggerFeedback("Errore Importazione", "Il file selezionato non è un backup valido di HandballPro.", "error");
      }
    }
  };

  const handleReset = () => {
    if (confirm("ATTENZIONE: Questo cancellerà tutti i dati (partite, anagrafica, impostazioni). Sei sicuro?")) {
      storage.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 animate-in fade-in duration-500 pb-20 relative">
      
      {/* HIGH-VISIBILITY FEEDBACK TOAST */}
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
          <p className="text-xs md:text-sm text-slate-500 font-medium">Configurazione sistema e database squadra</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'GENERAL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Generali
          </button>
          <button 
            onClick={() => setActiveTab('REGISTRY')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'REGISTRY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Anagrafica
          </button>
        </div>
      </div>

      {activeTab === 'GENERAL' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* User Profile Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 flex items-center gap-3">
              <User className="text-blue-400" size={20} />
              <h3 className="text-white font-black uppercase tracking-widest text-xs">Informazioni Utente</h3>
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
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Società Sportiva</label>
                <input 
                  type="text" 
                  placeholder="ES: HANDBALL CLUB MILANO"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.society}
                  onChange={e => setEditUser({...editUser, society: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                  <Lock size={12} className="text-amber-500" /> PIN Sicurezza Allenatore
                </label>
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Set 4-digit PIN"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 tracking-[0.5em]"
                  value={editUser.pin || ''}
                  onChange={e => setEditUser({...editUser, pin: e.target.value.replace(/\D/g, '')})}
                />
              </div>
              
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-2">
                  <Languages size={14} className="text-blue-500" /> {t.language} Applicazione
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
            {/* INVITATION CARD (Admin Only) */}
            {user.role === UserRole.ADMIN && (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-blue-600 p-6 flex items-center gap-3 text-white">
                  <InviteIcon size={20} />
                  <h3 className="font-black uppercase tracking-widest text-xs">{t.inviteTitle}</h3>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                   <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase">{t.inviteDesc}</p>
                   
                   <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex">
                      <button 
                        onClick={() => setInviteRole(UserRole.OFFICIAL)}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${inviteRole === UserRole.OFFICIAL ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                      >
                        {t.editorRole}
                      </button>
                      <button 
                        onClick={() => setInviteRole(UserRole.GUEST)}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${inviteRole === UserRole.GUEST ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                      >
                        {t.viewerRole}
                      </button>
                   </div>

                   <button 
                     onClick={handleGenerateInvite}
                     className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                   >
                     <LinkIcon size={18} className="text-blue-400" />
                     {t.generateLink}
                   </button>
                </div>
              </div>
            )}

            {/* Data Management Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-100 p-6 flex items-center gap-3">
                <Database className="text-slate-400" size={20} />
                <h3 className="text-slate-600 font-black uppercase tracking-widest text-xs">Gestione Dati</h3>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                <button onClick={() => { storage.exportAll(); onNotify("Backup generato correttamente"); }} className="w-full bg-white border border-slate-200 hover:border-blue-500 text-slate-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                  <Download size={16} className="text-blue-500" /> {t.export} Backup
                </button>
                
                <label className="w-full bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer">
                  <Upload size={16} className="text-emerald-500" /> {t.import} Backup
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>

                <button onClick={handleReset} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-100">
                  <Trash2 size={16} className="inline mr-2" /> Resetta App
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team Category Selector */}
          <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={20} /></div>
            <div className="flex-1 overflow-x-auto flex gap-2 no-scrollbar py-1">
               {allRegistries.length === 0 ? (
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Crea la tua prima squadra</p>
               ) : (
                 allRegistries.map((reg, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setCurrentRegIndex(idx)}
                     className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border shrink-0 ${currentRegIndex === idx ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                   >
                     {reg.category}
                   </button>
                 ))
               )}
            </div>
            <button 
              onClick={() => setShowAddTeamModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-90"
              title="Aggiungi Squadra"
            >
              <Plus size={20} />
            </button>
          </div>

          {allRegistries.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
              <TeamRegistry 
                profile={allRegistries[currentRegIndex]} 
                onSave={handleSaveRegistry} 
                isAdmin={user.role === UserRole.ADMIN || user.role === UserRole.OFFICIAL} 
                userPin={user.pin}
                t={t} 
              />
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button 
                   onClick={() => handleDeleteTeam(allRegistries[currentRegIndex].category)}
                   className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-2"
                 >
                   <Trash2 size={14} /> Elimina Database {allRegistries[currentRegIndex].category}
                 </button>
              </div>
            </div>
          ) : (
            <div className="py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <Users size={48} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nessuna Squadra</h3>
                   <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mt-1">Crea un'anagrafica per iniziare a gestire i roster delle tue categorie.</p>
                </div>
                <button 
                    onClick={() => setShowAddTeamModal(true)}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <Plus size={18} /> Crea Prima Squadra
                </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL NUOVA SQUADRA */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 flex justify-between items-center text-white">
                 <div>
                    <h3 className="font-black uppercase tracking-tight text-xl">Nuova Squadra</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Inizializza un nuovo database</p>
                 </div>
                 <button onClick={() => setShowAddTeamModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Layers size={14} className="text-emerald-500" /> Categoria (es. Under 17)
                    </label>
                    <input 
                       type="text"
                       autoFocus
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700"
                       value={newTeamData.category}
                       onChange={e => setNewTeamData({...newTeamData, category: e.target.value})}
                       placeholder="UNDER 17"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Shield size={14} className="text-emerald-500" /> Denominazione Squadra
                    </label>
                    <input 
                       type="text"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700"
                       value={newTeamData.teamName}
                       onChange={e => setNewTeamData({...newTeamData, teamName: e.target.value.toUpperCase()})}
                       placeholder="NOME DEL CLUB"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                       <Star size={14} className="text-emerald-500" /> 1° Allenatore
                    </label>
                    <input 
                       type="text"
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700"
                       value={newTeamData.coachName}
                       onChange={e => setNewTeamData({...newTeamData, coachName: e.target.value.toUpperCase()})}
                       placeholder="COGNOME E NOME"
                    />
                 </div>
                 <div className="pt-4 flex gap-4">
                    <button 
                       onClick={() => setShowAddTeamModal(false)}
                       className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 hover:bg-slate-100"
                    >
                       Annulla
                    </button>
                    <button 
                       onClick={handleConfirmAddTeam}
                       className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                       Crea Squadra
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
