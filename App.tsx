
import React, { useState, useEffect, useMemo } from 'react';
import { Match, Player, TeamProfile, UserRole, ScheduledMatch, UserProfile, Language, TrainingSession, Collaborator } from './types';
import { storage } from './services/storageService';
import { translations } from './translations';
import RosterSetup from './components/RosterSetup';
import MatchConsole from './components/MatchConsole';
import FinalReport from './components/FinalReport';
import MatchHistory from './components/MatchHistory';
import CalendarManager from './components/CalendarManager';
import Settings from './components/Settings';
import TrainingManager from './components/TrainingManager';
import UserManagement from './components/UserManagement';
import { Trophy, Plus, ClipboardList, ArrowLeft, Settings2, UserCircle, Home, LayoutGrid, Database, Activity, X, History as HistoryIcon, Layers, UserCheck, ShieldAlert, Eye, Calendar as CalendarIcon, UserCog, UserPlus, Check, Star, Settings as SettingsIcon, MapPin, Info, Languages, AlertTriangle, TrendingUp, Target, BarChart3, Shield, Zap, Clock, ChevronRight, Image as ImageIcon, CheckCircle2, Dumbbell, Link as LinkIcon, Users, Play } from 'lucide-react';

type AppState = 'HOME' | 'SETUP' | 'LIVE' | 'REPORT' | 'HISTORY' | 'CALENDAR' | 'SETTINGS' | 'TRAINING' | 'USER_MANAGEMENT';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface InviteData {
  role: UserRole;
  society: string;
  position: string;
  inviter: string;
}

const SUGGESTED_CATEGORIES = [
  "Serie A Gold", "Serie A Silver", "Serie A1 F", "Serie A2", "Serie B", 
  "Under 20", "Under 17", "Under 15", "Under 13", "Amichevole"
];

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('HOME');
  const [lang, setLang] = useState<Language>(() => storage.getLanguage());
  const t = translations[lang] || translations['it'];
  
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storage.getUser());
  const [pastMatches, setPastMatches] = useState<Match[]>(() => storage.getMatches());
  const [calendarMatches, setCalendarMatches] = useState<ScheduledMatch[]>(() => storage.getCalendar());
  const [allRegistries, setAllRegistries] = useState<TeamProfile[]>(() => storage.getAllRegistries());
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingInvite, setPendingInvite] = useState<InviteData | null>(null);

  // States per la configurazione del match
  const [match, setMatch] = useState<Match | null>(() => storage.getActiveMatch());
  const [homeTeam, setHomeTeam] = useState('LA MIA SQUADRA');
  const [awayTeam, setAwayTeam] = useState('AVVERSARI');
  const [homeLogo, setHomeLogo] = useState<string | undefined>(undefined);
  const [awayLogo, setAwayLogo] = useState<string | undefined>(undefined);
  const [matchCategory, setMatchCategory] = useState('');
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [homeStaff, setHomeStaff] = useState<Player[]>([]);
  const [awayStaff, setAwayStaff] = useState<Player[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const updateActivity = () => {
      storage.setUser(currentUser);
    };
    
    updateActivity();
    const interval = setInterval(updateActivity, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitePayload = params.get('invite');
    if (invitePayload) {
      try {
        const decoded = JSON.parse(atob(invitePayload)) as InviteData;
        if (decoded.role && decoded.society) {
          setPendingInvite(decoded);
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      } catch (e) {
        console.error("Payload invito non valido");
      }
    }
  }, []);

  const handleAcceptInvite = () => {
    if (pendingInvite) {
      const updatedUser: UserProfile = {
        ...currentUser,
        id: currentUser.id === 'default' ? Math.random().toString(36).substr(2, 9) : currentUser.id,
        role: pendingInvite.role,
        society: pendingInvite.society,
        position: pendingInvite.position,
        lastActive: Date.now()
      };
      storage.setUser(updatedUser);
      storage.syncCollaborator(updatedUser as Collaborator);
      setCurrentUser(updatedUser);
      setPendingInvite(null);
      showToast(`${t.saveProfile}: ${pendingInvite.position || pendingInvite.role} - ${pendingInvite.society}`);
    }
  };

  useEffect(() => {
    const active = storage.getActiveMatch();
    if (active && !active.isFinished) {
      setMatch(active);
      setView('LIVE');
    }
  }, []);

  useEffect(() => {
    setAllRegistries(storage.getAllRegistries());
  }, [view]);

  useEffect(() => {
    if (view === 'SETUP' && matchCategory) {
      const registry = storage.getRegistryByCategory(matchCategory);
      if (registry && (homeTeam === 'LA MIA SQUADRA' || !homeTeam)) {
        setHomeTeam(registry.teamName);
        setHomeLogo(registry.logo);
      }
    }
  }, [matchCategory, view]);

  const startMatch = () => {
    if (currentUser.role === UserRole.GUEST) {
      showToast(t.accessLevel + " Denied", "error");
      return;
    }
    const errors = [];
    if (!homeTeam.trim() || homeTeam === 'LA MIA SQUADRA') errors.push("Home team missing.");
    if (!awayTeam.trim() || awayTeam === 'AVVERSARI') errors.push("Away team missing.");
    if (homeRoster.length === 0) errors.push("Home roster empty.");
    if (awayRoster.length === 0) errors.push("Away roster empty.");
    if (!matchCategory.trim()) errors.push("Category missing.");
    if (errors.length > 0) { alert(errors.join("\n")); return; }

    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: matchCategory.trim(),
      homeTeamName: homeTeam.toUpperCase(),
      awayTeamName: awayTeam.toUpperCase(),
      homeLogo, awayLogo,
      homeRoster: JSON.parse(JSON.stringify(homeRoster)),
      awayRoster: JSON.parse(JSON.stringify(awayRoster)),
      homeStaff: JSON.parse(JSON.stringify(homeStaff)),
      awayStaff: JSON.parse(JSON.stringify(awayStaff)),
      events: [], isFinished: false, currentTime: 0, currentPeriod: 1,
      score: { home: 0, away: 0 }
    };
    setMatch(newMatch);
    storage.setActiveMatch(newMatch);
    setView('LIVE');
  };

  const finalizeMatch = () => {
    if (match) {
      const finishedMatch = { ...match, isFinished: true };
      storage.saveMatch(finishedMatch);
      storage.setActiveMatch(null);
      setPastMatches(storage.getMatches());
      setMatch(finishedMatch);
      setView('REPORT');
    }
  };

  const navigateTo = (newView: AppState) => {
    if ((newView === 'SETUP' || newView === 'USER_MANAGEMENT') && currentUser.role === UserRole.GUEST) {
      showToast(t.accessLevel + " Denied", "error");
      return;
    }
    setView(newView);
    window.scrollTo(0, 0);
  };

  const renderHome = () => (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {match && !match.isFinished && (
         <div className="mb-6 p-4 bg-blue-600 rounded-3xl text-white flex items-center justify-between gap-4 animate-bounce-subtle cursor-pointer hover:bg-blue-700 transition-colors shadow-xl shadow-blue-200" onClick={() => navigateTo('LIVE')}>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/20 rounded-xl"><Activity size={18} className="animate-pulse" /></div>
               <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{t.matchInProgress}</p>
                  <p className="font-black text-sm md:text-lg">{match.homeTeamName} {match.score.home} - {match.score.away} {match.awayTeamName}</p>
               </div>
            </div>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shrink-0">Live</button>
         </div>
      )}

      <div className="text-center mb-8 md:mb-12">
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="bg-blue-600 p-4 md:p-5 rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-blue-200 rotate-6 transition-transform hover:rotate-0">
            <Trophy size={48} className="text-white md:w-16 md:h-16" />
          </div>
        </div>
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-2 md:mb-4">Handball<span className="text-blue-600">Pro</span> <span className="text-slate-300 text-3xl md:text-5xl">3.0</span></h1>
        <p className="text-sm md:text-xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed px-4">{t.appTitleDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-12">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <button onClick={() => navigateTo('SETUP')} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-100"><Plus size={24} /></div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{t.newMatch}</h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{t.inviteDesc}</p>
          </button>

          <button onClick={() => navigateTo('TRAINING')} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all text-left group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-100"><Dumbbell size={24} /></div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{t.trainingLab}</h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{t.trainingDesc}</p>
          </button>
          
          <button onClick={() => navigateTo('CALENDAR')} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all text-left group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-100"><CalendarIcon size={24} /></div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{t.calendar}</h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{t.upcomingMatches}</p>
          </button>

          <button onClick={() => navigateTo('USER_MANAGEMENT')} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-amber-500 hover:shadow-xl transition-all text-left group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-amber-100"><Users size={24} /></div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{t.inviteTitle}</h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{t.collabDesc}</p>
          </button>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Shield size={20} /></div>
                <h3 className="font-black text-[10px] md:text-sm uppercase tracking-widest text-slate-800">{t.myTeams}</h3>
              </div>
              <button onClick={() => navigateTo('SETTINGS')} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><ChevronRight size={18} /></button>
            </div>
            <div className="space-y-4">
              {allRegistries.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-4 text-center">No teams configured.</p>
              ) : (
                allRegistries.map((reg, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    {reg.logo ? <img src={reg.logo} className="w-10 h-10 object-contain rounded-lg bg-white p-1" /> : <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-300 border border-slate-200"><Shield size={16} /></div>}
                    <div className="flex flex-col min-w-0">
                      <p className="text-[10px] font-black uppercase text-slate-900 truncate">{reg.teamName}</p>
                      <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">{reg.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button onClick={() => navigateTo('SETTINGS')} className="w-full bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between group">
             <div className="flex items-center gap-3">
                <SettingsIcon className="text-slate-500 group-hover:rotate-90 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">{t.configureApp}</span>
             </div>
             <ChevronRight size={20} className="text-slate-500" />
          </button>
        </div>
      </div>
      
      {pendingInvite && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="bg-blue-600 p-8 text-center text-white relative">
                 <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <UserPlus size={40} />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">{t.inviteWelcome}</h2>
                 <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">{t.setup} Profile</p>
              </div>
              <div className="p-8 text-center space-y-6">
                 <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-medium">{t.inviteFrom} <span className="text-slate-900 font-black uppercase">{pendingInvite.inviter}</span> {t.joinAs}</p>
                    <div className="bg-blue-50 border border-blue-100 py-3 rounded-2xl">
                       <span className="text-xl font-black text-blue-600 uppercase tracking-tighter">{pendingInvite.position || (pendingInvite.role === UserRole.OFFICIAL ? t.editorRole : t.viewerRole)}</span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">for {pendingInvite.society}</p>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button onClick={handleAcceptInvite} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                       {t.acceptInvite}
                    </button>
                    <button onClick={() => setPendingInvite(null)} className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-red-500 transition-colors py-2">
                       {t.decline}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-12">
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[999] animate-in fade-in slide-in-from-bottom-4 duration-300">
           <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest border border-white/20 backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {toast.message}
           </div>
        </div>
      )}

      <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-8 py-4 md:py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => navigateTo('HOME')}>
          <div className="bg-blue-600 p-2 md:p-2.5 rounded-xl shadow-lg group-hover:rotate-12 transition-all"><Trophy size={18} className="text-white md:w-[22px] md:h-[22px]" /></div>
          <span className="text-lg md:text-2xl font-black tracking-tighter text-slate-900">Handball<span className="text-blue-600">Pro</span> <span className="text-slate-400 text-xs md:text-sm">3.0</span></span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => navigateTo('HOME')} className={`p-2.5 md:p-3 rounded-xl transition-all ${view === 'HOME' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} title={t.home}><Home size={20} /></button>
          <button onClick={() => navigateTo('USER_MANAGEMENT')} className={`p-2.5 md:p-3 rounded-xl transition-all ${view === 'USER_MANAGEMENT' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} title={t.inviteTitle}><Users size={20} /></button>
          <button onClick={() => navigateTo('HISTORY')} className={`p-2.5 md:p-3 rounded-xl transition-all ${view === 'HISTORY' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} title={t.archive}><HistoryIcon size={20} /></button>
          <button onClick={() => navigateTo('SETTINGS')} className={`p-2.5 md:p-3 rounded-xl transition-all ${view === 'SETTINGS' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} title={t.settings}><SettingsIcon size={20} /></button>
        </div>
      </nav>

      <main className="container mx-auto">
        {view === 'HOME' && renderHome()}
        {view === 'TRAINING' && <TrainingManager onBack={() => setView('HOME')} onNavigateToSettings={() => setView('SETTINGS')} role={currentUser.role} t={t} />}
        {view === 'USER_MANAGEMENT' && <UserManagement onBack={() => setView('HOME')} onNotify={showToast} isAdmin={currentUser.role === UserRole.ADMIN} t={t} currentUser={currentUser} />}
        {view === 'SETTINGS' && <Settings user={currentUser} onUpdateUser={setCurrentUser} onBack={() => setView('HOME')} t={t} onLangChange={(l) => { setLang(l); storage.setLanguage(l); }} onNotify={showToast} />}
        {view === 'HISTORY' && <div className="p-4"><MatchHistory matches={pastMatches} onView={(m) => {setMatch(m); setView('REPORT');}} onDelete={(id) => { storage.deleteMatch(id); setPastMatches(storage.getMatches()); showToast("Match deleted"); }} onBack={() => setView('HOME')} canDelete={currentUser.role === UserRole.ADMIN} t={t} /></div>}
        {view === 'SETUP' && (
          <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 md:px-6 animate-in fade-in">
             <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">{t.setup} Gara</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t.roster} & {t.staff}</p>
              </div>
              <button onClick={() => navigateTo('HOME')} className="flex items-center gap-2 px-6 py-3 text-slate-400 font-black hover:text-slate-900 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest text-[10px] transition-all active:scale-95">
                <ArrowLeft size={16} /> {t.home}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
              {/* Category & Teams */}
              <div className="md:col-span-12 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.category} Gara</label>
                    <div className="relative">
                       <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input 
                         list="setup-categories"
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                         value={matchCategory}
                         onChange={e => setMatchCategory(e.target.value)}
                         placeholder="Seleziona Categoria..."
                       />
                       <datalist id="setup-categories">
                          {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                       </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.homeTeam}</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                      value={homeTeam}
                      onChange={e => setHomeTeam(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.awayTeam}</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 uppercase outline-none focus:ring-2 focus:ring-blue-500"
                      value={awayTeam}
                      onChange={e => setAwayTeam(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              {/* Roster Setup Components */}
              <div className="md:col-span-6">
                 <RosterSetup 
                   teamName={homeTeam}
                   roster={homeRoster}
                   staff={homeStaff}
                   onUpdate={setHomeRoster}
                   onUpdateStaff={setHomeStaff}
                   accentColor="blue"
                   allRegistries={allRegistries}
                   t={t}
                 />
              </div>

              <div className="md:col-span-6">
                 <RosterSetup 
                   teamName={awayTeam}
                   roster={awayRoster}
                   staff={awayStaff}
                   onUpdate={setAwayRoster}
                   onUpdateStaff={setAwayStaff}
                   accentColor="red"
                   allRegistries={allRegistries}
                   t={t}
                 />
              </div>

              <div className="md:col-span-12 py-8">
                 <button 
                   onClick={startMatch}
                   className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all hover:bg-black active:scale-[0.98] flex items-center justify-center gap-4 group"
                 >
                    <div className="bg-blue-600 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
                       <Play fill="currentColor" size={24} />
                    </div>
                    {t.kickOff}
                 </button>
              </div>
            </div>
          </div>
        )}
        {view === 'LIVE' && match && <div className="p-4"><MatchConsole match={match} onUpdate={setMatch} onFinish={finalizeMatch} t={t} /></div>}
        {view === 'REPORT' && match && <div className="p-4"><FinalReport match={match} onClose={() => setView('HOME')} t={t} language={lang} /></div>}
        {view === 'CALENDAR' && <div className="p-4"><CalendarManager matches={calendarMatches} onAdd={(m) => setCalendarMatches([...calendarMatches, m])} onDelete={(id) => setCalendarMatches(calendarMatches.filter(x => x.id !== id))} onStart={(sm) => { setMatchCategory(sm.category); setHomeTeam(sm.homeTeam); setAwayTeam(sm.awayTeam); setView('SETUP'); }} onBack={() => setView('HOME')} canEdit={currentUser.role === UserRole.ADMIN} suggestedCategories={SUGGESTED_CATEGORIES} t={t} /></div>}
      </main>
    </div>
  );
};

export default App;