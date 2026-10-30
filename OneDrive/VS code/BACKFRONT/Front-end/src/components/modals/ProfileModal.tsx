import React, { useState } from 'react';
import { UserProfile, EmergencyContact } from '../../types';
import { authService } from '../../services/firebase/authService';
import { isFirebaseConfigured } from '../../services/firebase/firebaseConfig';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  User,
  Shield,
  Phone,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Cloud,
  Cpu,
  Bell,
  Lock,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(authService.getCurrentUser());
  const [isSaved, setIsSaved] = useState(false);

  // New Contact Input state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Family');

  if (!isOpen) return null;

  const handleSave = async () => {
    await authService.updateProfile(profile);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: `c_${Date.now()}`,
      name: contactName,
      phone: contactPhone,
      relationship: contactRelation,
      notifyOnSos: true,
    };

    setProfile((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact],
    }));

    setContactName('');
    setContactPhone('');
    setShowAddContact(false);
  };

  const handleDeleteContact = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((c) => c.id !== id),
    }));
  };

  const cloudSync = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                User Safety Profile
              </h3>
              <p className="text-[11px] text-slate-400">Manage identity, emergency circle & sync preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Integration Status Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Cloud className={`w-4 h-4 ${cloudSync ? 'text-emerald-500' : 'text-blue-500'}`} />
            <div>
              <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200">{t.firebaseStatus}</p>
              <p className="text-[10px] text-slate-400">
                {cloudSync ? t.firebaseConnected : t.firebaseLocal}
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-500" />
            <div>
              <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200">{t.aiModelStatus}</p>
              <p className="text-[10px] text-slate-400">{t.aiModelLabel}</p>
            </div>
          </div>
        </div>

        {/* User Details Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Primary Phone
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Trusted Emergency Contacts */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.trustedContacts} ({profile.emergencyContacts.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowAddContact(!showAddContact)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addContact}</span>
            </button>
          </div>

          {/* Add Contact Sub-form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. Brother)"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Phone number"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-2.5 py-1 text-xs text-slate-500"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {/* Contacts List */}
          <div className="space-y-1.5">
            {profile.emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{contact.name}</p>
                  <p className="text-[11px] text-slate-400">{contact.phone} • {contact.relationship}</p>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  title="Remove Contact"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Preferences Toggles */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Automated Protection Settings
          </h4>

          <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Stationary Trip Stall Auto-Alert
              </p>
              <p className="text-[11px] text-slate-400">Alert trusted contacts if vehicle stops for &gt; 5 min</p>
            </div>
            <input
              type="checkbox"
              checked={profile.autoAlertOnStall}
              onChange={(e) => setProfile({ ...profile, autoAlertOnStall: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                High-Risk Zone Proximity Chimes
              </p>
              <p className="text-[11px] text-slate-400">Audio advisory when approaching unlit or waterlogged sector</p>
            </div>
            <input
              type="checkbox"
              checked={profile.highRiskAlertsEnabled}
              onChange={(e) => setProfile({ ...profile, highRiskAlertsEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : null}
            <span>{isSaved ? 'Saved!' : t.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
