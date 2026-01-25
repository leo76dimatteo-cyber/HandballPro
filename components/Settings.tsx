
import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { storage } from '../services/storageService';
import { User, Shield, Database, Download, Upload, Trash2, Check, X, LogOut, Key } from 'lucide-react';

interface SettingsProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onBack }) => {
  const [editUser, setEditUser] = useState<UserProfile>(user);
  const [showPinForm, setShowPinForm] = useState(false);
  const [tempPin, setTempPin] = useState('');

  const handleSaveProfile = () => {
    storage.setUser(editUser);
    onUpdateUser(editUser);
    alert("Profilo aggiornato!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await storage.importAll(file);
      if (ok) {
        alert("Dati importati con successo! L'app verrà ricaricata.");
        window.location.reload();
      } else {
        alert("File non valido.");
      }
    }
  };

  const handleReset = () => {
    if (confirm("ATTENZIONE: Questo cancellerà DEFINITIVAMENTE tutti i dati (anagrafica, partite, calendari). Sei sicuro?")) {
      storage.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Impostazioni</h2>
          <p className="text-slate-500 font-medium">Gestione profilo e manutenzione dati</p>
        </div>
        <button onClick={onBack} className="p-3 text-slate-400 hover:text-slate-900 bg-white rounded-xl border border-slate-100 transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-900 p-6 flex items-center gap-3">
            <User className="text-blue-400" size={20} />
            <h3 className="text-white font-black uppercase tracking-widest text-xs">Profilo Operatore</h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.firstName}
                  onChange={e => setEditUser({...editUser, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cognome</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.lastName}
                  onChange={e => setEditUser({...editUser, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Società / Ente</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={editUser.society}
                onChange={e => setEditUser({...editUser, society: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ruolo Attuale</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={editUser.role}
                onChange={e => setEditUser({...editUser, role: e.target.value as UserRole})}
              >
                <option value={UserRole.ADMIN}>Amministratore</option>
                <option value={UserRole.OFFICIAL}>Ufficiale di Gara</option>
                <option value={UserRole.GUEST}>Ospite (Sola Lettura)</option>
              </select>
            </div>
            <button onClick={handleSaveProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
              <Check size={18} /> Salva Profilo
            </button>
          </div>
        </div>

        {/* Data Management Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-600 p-6 flex items-center gap-3">
            <Database className="text-white" size={20} />
            <h3 className="text-white font-black uppercase tracking-widest text-xs">Gestione Dati</h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <h4 className="text-blue-900 font-black text-xs uppercase mb-2 flex items-center gap-2">
                <Shield size={14} /> Sicurezza locale
              </h4>
              <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                Tutti i dati sono salvati esclusivamente nel browser attuale. Per trasferire i dati su un altro dispositivo o browser, utilizza le funzioni di esportazione e importazione.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={storage.exportAll} className="w-full bg-white border border-slate-200 hover:border-blue-500 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                <Download size={18} className="text-blue-500" /> Esporta Database (.JSON)
              </button>
              
              <label className="w-full bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer">
                <Upload size={18} className="text-emerald-500" /> Ripristina Backup
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button onClick={handleReset} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-red-100">
                  <Trash2 size={18} /> Resetta l'App
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
