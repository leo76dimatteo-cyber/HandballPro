
import React, { useState, useEffect } from 'react';
import { Collaborator, UserRole, UserProfile } from '../types';
import { storage } from '../services/storageService';
import { Users, UserCheck, Shield, Eye, Trash2, ArrowLeft, MoreVertical, CheckCircle2, Circle, Clock, Mail, ShieldAlert, UserPlus, Info, Smartphone, Monitor, Tablet, Briefcase } from 'lucide-react';

interface UserManagementProps {
  onBack: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  isAdmin: boolean;
  t: any;
  currentUser: UserProfile;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack, onNotify, isAdmin, t, currentUser }) => {
  const [users, setUsers] = useState<Collaborator[]>(() => storage.getCollaborators());

  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(storage.getCollaborators());
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleUpdateRole = (id: string, role: UserRole) => {
    if (!isAdmin) return;
    storage.updateCollaboratorRole(id, role);
    setUsers(storage.getCollaborators());
    onNotify(t.saveChanges);
  };

  const handleRemove = (id: string) => {
    if (!isAdmin) return;
    if (id === currentUser.id) {
      onNotify("Self removal blocked", "error");
      return;
    }
    if (confirm("Revoke access for this user?")) {
      storage.removeCollaborator(id);
      setUsers(storage.getCollaborators());
      onNotify(t.delete);
    }
  };

  const getDeviceIcon = (type?: string) => {
    switch(type) {
      case 'Mobile': return <Smartphone size={14} />;
      case 'Tablet': return <Tablet size={14} />;
      case 'Desktop': return <Monitor size={14} />;
      default: return <Circle size={10} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
           <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl">
              <Users size={32} />
           </div>
           <div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">{t.inviteTitle}</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t.collabDesc}</p>
           </div>
        </div>
        <button onClick={onBack} className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100">
           <ArrowLeft size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
               <UserCheck size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online</p>
               <p className="text-2xl font-black text-slate-900">{users.filter(u => u.isOnline).length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
               <Shield size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.editorRole}</p>
               <p className="text-2xl font-black text-slate-900">{users.filter(u => u.role === UserRole.OFFICIAL).length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
               <Smartphone size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Devices</p>
               <p className="text-2xl font-black text-slate-900">{users.length}</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">{t.userInfo}: {currentUser.society}</h3>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">User</th>
                     <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.accessLevel}</th>
                     <th className="px-8 py-5"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {users.sort((a,b) => (a.isOnline ? -1 : 1)).map((user) => (
                    <tr key={user.id + (user.deviceName || '')} className={`hover:bg-slate-50/50 transition-colors group ${user.id === currentUser.id ? 'bg-blue-50/20' : ''}`}>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg relative ${user.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-blue-500'}`}>
                                {getDeviceIcon(user.deviceType)}
                                {user.isOnline && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none">{user.lastName} {user.firstName}</h4>
                                   {user.id === currentUser.id && <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Tu</span>}
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          {user.isOnline ? (
                             <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Online</span>
                             </div>
                          ) : (
                             <div className="flex items-center gap-2 text-slate-300">
                                <Circle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
                             </div>
                          )}
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                             {isAdmin && user.id !== currentUser.id ? (
                                <select 
                                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-blue-500 outline-none w-fit"
                                  value={user.role}
                                  onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                >
                                   <option value={UserRole.OFFICIAL}>{t.editorRole}</option>
                                   <option value={UserRole.GUEST}>{t.viewerRole}</option>
                                </select>
                             ) : (
                                <div className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest inline-block w-fit ${user.role === UserRole.ADMIN ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                   {user.role}
                                </div>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          {isAdmin && user.id !== currentUser.id && (
                             <button onClick={() => handleRemove(user.id)} className="p-3 text-slate-300 hover:text-red-500 bg-white border border-slate-100 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                <Trash2 size={18} />
                             </button>
                          )}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default UserManagement;
