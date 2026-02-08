
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Language, TeamProfile } from '../types';
import { storage } from '../services/storageService';
import TeamRegistry from './TeamRegistry';
import { User, Shield, Database, Download, Upload, Trash2, Check, X, LogOut, Key, Languages, Users, Settings as SettingsIcon, Lock, Plus, Layers, Star, UserPlus as InviteIcon, Link as LinkIcon, Share2, CheckCircle2, AlertCircle, Info as InfoIcon, ChevronDown, Copy, Smartphone, Monitor, RefreshCw, Briefcase, BookOpen, HelpCircle, Zap } from 'lucide-react';

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
      `${t.settings} for ${editUser.society || 'your club'} saved.`
    );
  };

  const handleImportIdentity = () => {
    if (importId.length < 5) {
       onNotify("Insert valid ID", "error");
       return;
    }
    const updatedUser = { ...editUser, id: importId };
    storage.setUser(updatedUser);
    onUpdateUser(updatedUser);
    setEditUser(updatedUser);
    setImportId('');
    triggerFeedback(t.multiDevice, "Personal ID synced.");
  };

  const handleGenerateInvite = async () => {
    if (!user.society) {
      onNotify("Set club name first", "error");
      return;
    }

    const payload = btoa(JSON.stringify({
      role: inviteRole,
      society: user.society,
      position: invitePosition.trim() || (inviteRole === UserRole.OFFICIAL ? 'Editor' : 'Viewer'),
      inviter: `${user.lastName} ${user.firstName}`,
      userId: user.id
    }));

    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${payload}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'HandballPro Invite',
          text: `Join team ${user.society} on HandballPro!`,
          url: inviteUrl
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        triggerFeedback(t.linkCopied, "", "info");
      }
    } catch (err) {
      console.error("Share error", err);
    }
  };

  const handleSaveRegistry = (newProfile: TeamProfile) => {
    storage.saveRegistry(newProfile);
    const updated = storage.getAllRegistries();
    setAllRegistries(updated);
    triggerFeedback(
      t.registry, 
      `${t.category} ${newProfile.category} synced.`,
      "success"
    );
  };

  const handleConfirmAddTeam = () => {
    const { category, teamName, coachName } = newTeamData;
    if (!category.trim() || !teamName.trim()) {
      onNotify("Required fields missing", "error");
      return;
    }
    if (allRegistries.some(r => r.category.toUpperCase() === category.trim().toUpperCase())) {
      onNotify("Category already exists", "error");
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
    if (confirm(`Delete database for ${category}?`)) {
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
        triggerFeedback(t.import, "App will reload.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        triggerFeedback(t.import, "Invalid file.", "error");
      }
    }
  };

  const handleReset = () => {
    if (confirm(t.confirmResetMatch)) {
      storage.clearAll();
      window.location.reload();
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
          <p className="text-xs md:text-sm text-slate-500 font-medium">System configuration and team database</p>
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
                  placeholder="EX: HANDBALL CLUB"
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
                    placeholder="EX: COACH"
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
                  placeholder="Set 4-digit PIN"
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
                <h3 className="font-black uppercase tracking-widest text-xs">{t.multiDevice}</h3>
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
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.linkDevice}</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Paste ID from another device"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={importId}
                      onChange={e => setImportId(e.target.value)}
                    />
                    <button onClick={handleImportIdentity} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all shadow-md"><RefreshCw size={18} /></button>
                  </div>
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
                        placeholder="EX: Assistant Coach, Manager, etc."
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
                <button onClick={() => { storage.exportAll(); onNotify(t.export + " Success"); }} className="w-full bg-white border border-slate-200 hover:border-blue-500 text-slate-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
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
                      <option disabled>No teams configured</option>
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
                 <button onClick={() => handleDeleteTeam(allRegistries[currentRegIndex].category)} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-2"><Trash2 size={14} /> {t.delete} Database {allRegistries[currentRegIndex].category}</button>
              </div>
            </div>
          ) : (
            <div className="py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Users size={48} /></div>
                <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Team</h3><p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mt-1">Create a registry to manage your team rosters.</p></div>
                <button onClick={() => setShowAddTeamModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"><Plus size={18} /> Create First Team</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'GUIDE' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                 <div className="bg-blue-600 p-4 rounded-[2rem] text-white shadow-xl shadow-blue-100"><BookOpen size={36} /></div>
                 <div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">{t.operationalManual}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Professional configuration guide</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">1</div>
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Profile & Security</h3>
                    </div>
                    <div className="space-y-4 pl-11">
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs font-black text-slate-700 uppercase mb-2">{t.techQual} & {t.accessLevel}</p>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">Technical qualification is a label for your reports. Access level defines permissions.</p>
                       </div>
                    </div>
                 </section>
              </div>

              <div className="mt-12 pt-12 border-t border-slate-100 text-center">
                 <button onClick={() => setActiveTab('GENERAL')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Back to Settings</button>
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
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Team database initialization</p>
                 </div>
                 <button onClick={() => setShowAddTeamModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Layers size={14} className="text-emerald-500" /> {t.category}</label>
                    <input type="text" autoFocus className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newTeamData.category} onChange={e => setNewTeamData({...newTeamData, category: e.target.value})} placeholder="UNDER 17" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Shield size={14} className="text-emerald-500" /> {t.homeTeam}</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newTeamData.teamName} onChange={e => setNewTeamData({...newTeamData, teamName: e.target.value.toUpperCase()})} placeholder="CLUB NAME" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2"><Star size={14} className="text-emerald-500" /> 1° {t.staff}</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700" value={newTeamData.coachName} onChange={e => setNewTeamData({...newTeamData, coachName: e.target.value.toUpperCase()})} placeholder="COACH NAME" />
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
