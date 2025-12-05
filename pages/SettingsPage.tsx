
import React, { useState, useEffect } from 'react';
import { Moon, Sun, User, Volume2, LogOut, Check, Play, CreditCard, Zap, ChevronRight, Lock, Activity, Shield, Bell, Mic, MapPin, ToggleRight, ToggleLeft, Star, Type } from 'lucide-react';
import { AppMode, UserSettings, PlanType, AppFont } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSpeech } from '../hooks/useSpeech';

// Razorpay Declaration
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface SettingsPageProps {
  mode: AppMode;
  navigate: (mode: AppMode) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  settings: UserSettings;
  updateSettings: (s: UserSettings) => void;
}

// --- SUB COMPONENTS to prevent Hook violations ---

const SecuritySettings = ({ settings, updateSettings }: { settings: UserSettings, updateSettings: (s: UserSettings) => void }) => {
    const { user } = useAuth();

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-slide-in">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Security & Permissions</h2>
            
            <div className="space-y-6">
                <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Device Access</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Mic size={20} className="text-black dark:text-white" />
                                <span className="text-gray-900 dark:text-white font-medium">Microphone</span>
                            </div>
                            <button onClick={() => updateSettings({...settings, enableMic: !settings.enableMic})}>
                                {settings.enableMic ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-300 dark:text-gray-600" />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <MapPin size={20} className="text-black dark:text-white" />
                                <span className="text-gray-900 dark:text-white font-medium">Location</span>
                            </div>
                            <button onClick={() => updateSettings({...settings, enableLocation: !settings.enableLocation})}>
                                {settings.enableLocation ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-300 dark:text-gray-600" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Connected Accounts</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <User size={20} className="text-black dark:text-white" />
                            <div>
                                <p className="text-gray-900 dark:text-white font-medium">Google Account</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <button className="text-xs font-bold text-gray-900 dark:text-white border-b border-black dark:border-white">Manage</button>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-400 mb-2">
                        <Shield size={16} />
                        <span className="text-xs font-bold uppercase">End-to-End Encryption</span>
                    </div>
                    <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                        Your conversations and personal data are encrypted. We do not sell your personal information to third parties.
                    </p>
                </div>
            </div>
        </div>
    );
};

const NotificationSettings = ({ settings, updateSettings }: { settings: UserSettings, updateSettings: (s: UserSettings) => void }) => {
    
    const playNotificationSound = (tone: string) => {
      try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          if (tone === 'Chime') osc.frequency.value = 800;
          else if (tone === 'Cosmic') osc.frequency.value = 600;
          else osc.frequency.value = 440; 
          
          if (tone === 'Silent') return;

          osc.type = 'sine';
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
          osc.stop(ctx.currentTime + 0.5);
      } catch (e) { console.error(e); }
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-slide-in">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Notifications</h2>

            <div className="space-y-6">
                <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Alert Sound</h3>
                    <div className="space-y-1">
                        {['Default', 'Chime', 'Cosmic', 'Silent'].map(tone => (
                            <button 
                                key={tone}
                                onClick={() => {
                                    playNotificationSound(tone);
                                    updateSettings({...settings, notificationRingtone: tone});
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="text-gray-900 dark:text-white font-medium">{tone}</span>
                                {settings.notificationRingtone === tone && <Check size={18} className="text-black dark:text-white" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Control Panel</h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">Reminders</p>
                            <p className="text-xs text-gray-500">Get alerted for tasks</p>
                        </div>
                        <button onClick={() => updateSettings({...settings, notifyReminders: !settings.notifyReminders})}>
                            {settings.notifyReminders 
                            ? <ToggleRight size={32} className="text-green-500" /> 
                            : <ToggleLeft size={32} className="text-gray-300 dark:text-gray-600" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">App Updates</p>
                            <p className="text-xs text-gray-500">New features & patches</p>
                        </div>
                        <button onClick={() => updateSettings({...settings, notifyUpdates: !settings.notifyUpdates})}>
                            {settings.notifyUpdates
                            ? <ToggleRight size={32} className="text-green-500" /> 
                            : <ToggleLeft size={32} className="text-gray-300 dark:text-gray-600" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">Promotions</p>
                            <p className="text-xs text-gray-500">Deals and offers</p>
                        </div>
                        <button onClick={() => updateSettings({...settings, notifyPromos: !settings.notifyPromos})}>
                            {settings.notifyPromos
                            ? <ToggleRight size={32} className="text-green-500" /> 
                            : <ToggleLeft size={32} className="text-gray-300 dark:text-gray-600" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SubscriptionSettings = ({ settings, updateSettings, isDarkMode, navigate }: { settings: UserSettings, updateSettings: (s: UserSettings) => void, isDarkMode: boolean, navigate: (m: AppMode) => void }) => {
    const { user } = useAuth();
    
    const handlePayment = (planName: PlanType, amountInRupees: number) => {
        if (!window.Razorpay) {
            // Fallback for demo if script blocked
            if(confirm("Payment Gateway unreachable. Simulate successful payment for demo?")) {
                updateSettings({ ...settings, plan: planName });
                alert(`Success! You are now on ${planName} Plan.`);
            }
            return;
        }

        const rzpKey = "rzp_test_YourKeyHere"; 

        const options = {
            key: rzpKey,
            amount: amountInRupees * 100, 
            currency: "INR",
            name: "CRAB AI",
            description: `${planName} Plan Subscription`,
            handler: function (response: any) {
                console.log("Payment Success:", response);
                updateSettings({ ...settings, plan: planName });
                alert(`Welcome to ${planName} Plan.`);
            },
            prefill: {
                name: settings.userName,
                email: user?.email,
                contact: ""
            },
            theme: { color: "#000000" }
        };

        try {
            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response: any){
                alert(`Payment Failed: ${response.error.description}`);
            });
            rzp1.open();
        } catch(e) {
            // If key is invalid or other error
            if(confirm("Dev Mode: Simulate Successful Payment?")) {
                updateSettings({ ...settings, plan: planName });
            }
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-slide-in pb-24">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Upgrade Plan</h2>
            <p className="text-gray-500 text-sm mb-6">Unlock the full potential of your cosmic assistant.</p>
            
            <div className="space-y-6 max-w-lg mx-auto">
                <PlanCard 
                    title="Free" 
                    price="₹0" 
                    features={["Basic Voice Commands", "Standard Reminders", "Limited History"]}
                    current={settings.plan === 'FREE'}
                    onClick={() => {}}
                    isDarkMode={isDarkMode}
                />
                <PlanCard 
                    title="Pro" 
                    price="₹99" 
                    period="/mo"
                    features={["All Free Features", "Unlimited Chat History", "Faster AI Response", "10+ Custom Voices"]}
                    current={settings.plan === 'PRO'}
                    recommended
                    onClick={() => handlePayment('PRO', 99)}
                    isDarkMode={isDarkMode}
                    icon={<Zap size={20} className="text-black dark:text-white" />}
                />
                <PlanCard 
                    title="Ultra" 
                    price="₹149" 
                    period="/mo"
                    features={["All Pro Features", "GPT-4 Level Intelligence", "Deep Screen Analysis", "Priority Support"]}
                    current={settings.plan === 'ULTRA'}
                    onClick={() => handlePayment('ULTRA', 149)}
                    isDarkMode={isDarkMode}
                    icon={<Star size={20} className="text-black dark:text-white" />}
                />
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

const SettingsPage: React.FC<SettingsPageProps> = ({ mode, navigate, isDarkMode, setIsDarkMode, settings, updateSettings }) => {
  const { logout, user } = useAuth();
  const { speak } = useSpeech();

  const [localAgentName, setLocalAgentName] = useState(settings.agentName);
  const [localUserName, setLocalUserName] = useState(settings.userName || 'User');
  const [localWakeword, setLocalWakeword] = useState(settings.wakeword);
  const [localVoice, setLocalVoice] = useState(settings.voiceId);

  useEffect(() => {
      setLocalAgentName(settings.agentName);
      setLocalUserName(settings.userName || 'User');
      setLocalWakeword(settings.wakeword);
      setLocalVoice(settings.voiceId);
  }, [settings]);

  const handleSaveWakeword = () => {
      updateSettings({
          ...settings,
          userName: localUserName,
          agentName: localAgentName,
          wakeword: localWakeword
      });
  };

  const handleSaveVoice = (voiceId: string) => {
      setLocalVoice(voiceId);
      updateSettings({ ...settings, voiceId: voiceId });
  };

  const handlePreviewVoice = (e: React.MouseEvent, voiceId: string) => {
      e.stopPropagation();
      speak(`Hello ${settings.userName || 'there'}, I am ${voiceId}.`, voiceId);
  };

  const femaleVoices = ["Cosmic", "Nebula", "Star", "Nova", "Galaxy"];
  const maleVoices = ["Void", "Pulsar", "Orbit", "Quantum", "Atlas"];

  // Router for Settings Sub-Pages
  if (mode === AppMode.SETTINGS_SECURITY) {
      return <SecuritySettings settings={settings} updateSettings={updateSettings} />;
  }

  if (mode === AppMode.SETTINGS_NOTIFICATIONS_CONFIG) {
      return <NotificationSettings settings={settings} updateSettings={updateSettings} />;
  }

  if (mode === AppMode.SETTINGS_SUBSCRIBE) {
      return <SubscriptionSettings settings={settings} updateSettings={updateSettings} isDarkMode={isDarkMode} navigate={navigate} />;
  }

  if (mode === AppMode.SETTINGS_WAKEWORD) {
      const changesLeft = 2 - (settings.nameChangeCount || 0);
      const isNameDisabled = changesLeft <= 0;

      return (
          <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-slide-in">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Profile & Assistant</h2>
              
              <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
                  <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Your Profile</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Display Name</label>
                        <input 
                            type="text" 
                            value={localUserName}
                            onChange={(e) => setLocalUserName(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white"
                        />
                      </div>
                  </div>
                  
                  <div className="border-t border-gray-100 dark:border-gray-700"></div>

                  <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Assistant Profile</h3>
                      
                      <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent Name</label>
                            <span className={`text-xs ${isNameDisabled ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                                {isNameDisabled ? 'Limit Reached' : `${changesLeft} changes left`}
                            </span>
                          </div>
                          <input 
                            type="text" 
                            disabled={isNameDisabled}
                            value={localAgentName}
                            onChange={(e) => setLocalAgentName(e.target.value)}
                            className={`w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white ${isNameDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wake Phrase</label>
                          <input 
                            type="text" 
                            value={localWakeword}
                            onChange={(e) => setLocalWakeword(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white"
                          />
                      </div>
                  </div>

                  <button onClick={handleSaveWakeword} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                    Save All Changes
                  </button>
              </div>
          </div>
      );
  }

  if (mode === AppMode.SETTINGS_VOICE) {
      return (
          <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-slide-in">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Voice Selection</h2>
              <div className="space-y-6">
                  <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">Female Voices</h3>
                      <div className="space-y-3">
                          {femaleVoices.map(voice => (
                              <VoiceOption key={voice} voice={voice} isSelected={localVoice === voice} onSelect={() => handleSaveVoice(voice)} onPreview={(e) => handlePreviewVoice(e, voice)} />
                          ))}
                      </div>
                  </div>
                   <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">Male Voices</h3>
                      <div className="space-y-3">
                          {maleVoices.map(voice => (
                              <VoiceOption key={voice} voice={voice} isSelected={localVoice === voice} onSelect={() => handleSaveVoice(voice)} onPreview={(e) => handlePreviewVoice(e, voice)} />
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (mode === AppMode.SETTINGS_CUSTOMIZATION) {
      const fonts: AppFont[] = ['Inter', 'Roboto Mono', 'Merriweather', 'Quicksand', 'Orbitron'];

      return (
          <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg animate-slide-in">
             <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Customization</h2>
             
             {/* Theme Toggle */}
             <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
                 <div className="p-4 flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                         <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">
                             {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                         </div>
                         <div>
                             <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                             <p className="text-xs text-gray-500">Adjust appearance</p>
                         </div>
                     </div>
                     <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-black dark:bg-white' : 'bg-gray-300'}`}
                     >
                         <div className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-black rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                 </div>
             </div>

             {/* Font Selector */}
             <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                     <Type size={14}/>
                     <span>App Font Style</span>
                 </h3>
                 <div className="space-y-2">
                     {fonts.map(font => (
                         <button
                             key={font}
                             onClick={() => updateSettings({...settings, font})}
                             className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${settings.font === font ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                         >
                             <span style={{ fontFamily: font }}>{font}</span>
                             {settings.font === font && <Check size={16} />}
                         </button>
                     ))}
                 </div>
             </div>

          </div>
      );
  }

  // --- Main Settings List ---

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
      
      <div className="space-y-4">
        {/* Account Section */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4 mb-6 relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xl font-bold shadow-lg z-10 shrink-0">
                {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="z-10 overflow-hidden">
                <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{settings.userName || 'User'}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shrink-0">
                        {settings.plan}
                    </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <SettingItem icon={<Sun size={20} />} label="Customization" subLabel={isDarkMode ? 'Dark Mode' : 'Light Mode'} onClick={() => navigate(AppMode.SETTINGS_CUSTOMIZATION)} />
            <SettingItem icon={<Activity size={20} />} label="Health & Fitness" subLabel="Gym, Stats & Goals" onClick={() => navigate(AppMode.HEALTH)} />
            <SettingItem icon={<CreditCard size={20} />} label="Subscription" subLabel={settings.plan === 'FREE' ? 'Upgrade Plan' : `Current: ${settings.plan}`} onClick={() => navigate(AppMode.SETTINGS_SUBSCRIBE)} highlight={settings.plan === 'FREE'}/>
            <SettingItem icon={<User size={20} />} label="Profile & Assistant" subLabel="Name, Wakeword" onClick={() => navigate(AppMode.SETTINGS_WAKEWORD)} />
            <SettingItem icon={<Volume2 size={20} />} label="Voice & Sound" subLabel={settings.voiceId} onClick={() => navigate(AppMode.SETTINGS_VOICE)} />
            <SettingItem icon={<Bell size={20} />} label="Notifications" subLabel="Ringtone & Alerts" onClick={() => navigate(AppMode.SETTINGS_NOTIFICATIONS_CONFIG)} />
            <SettingItem icon={<Shield size={20} />} label="Security" subLabel="Permissions & Access" onClick={() => navigate(AppMode.SETTINGS_SECURITY)} />
        </div>

        <button onClick={() => logout()} className="w-full p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-800 flex items-center justify-center space-x-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <LogOut size={20} />
            <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

const PlanCard: React.FC<{ title: string, price: string, period?: string, features: string[], current: boolean, recommended?: boolean, onClick: () => void, isDarkMode: boolean, icon?: React.ReactNode }> = ({ title, price, period, features, current, recommended, onClick, isDarkMode, icon }) => (
    <div className={`relative p-6 rounded-3xl border transition-all duration-300 ${current ? 'bg-white dark:bg-dark-surface border-black dark:border-white shadow-md' : recommended ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xl' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-800'}`}>
        {recommended && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Most Popular</div>}
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className={`text-lg font-bold ${recommended ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
                <div className="flex items-baseline mt-1">
                    <span className={`text-3xl font-bold ${recommended ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>{price}</span>
                    {period && <span className={`text-sm ${recommended ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}>{period}</span>}
                </div>
            </div>
            {icon}
        </div>
        <ul className="space-y-3 mb-6">
            {features.map((f, i) => (
                <li key={i} className="flex items-start space-x-3 text-sm">
                    <Check size={16} className={`mt-0.5 ${recommended ? 'text-gray-400 dark:text-black' : 'text-black dark:text-white'}`} />
                    <span className={recommended ? 'text-gray-300 dark:text-gray-700' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
                </li>
            ))}
        </ul>
        {current ? <button disabled className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-bold text-sm cursor-default">Current Plan</button> : <button onClick={onClick} className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform ${recommended ? 'bg-white dark:bg-black text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}>Choose {title}</button>}
    </div>
);

const VoiceOption: React.FC<{ voice: string, isSelected: boolean, onSelect: () => void, onPreview: (e: any) => void }> = ({ voice, isSelected, onSelect, onPreview }) => (
    <div onClick={onSelect} className={`w-full p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-black/5 dark:bg-white/10 border-black dark:border-white' : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
        <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><Volume2 size={20} /></div>
            <div className="text-left"><p className={`font-semibold ${isSelected ? 'text-black dark:text-white' : 'text-gray-900 dark:text-white'}`}>{voice}</p></div>
        </div>
        <div className="flex items-center space-x-3">
            <button onClick={onPreview} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-black dark:hover:text-white transition-colors"><Play size={16} fill="currentColor" /></button>
            {isSelected && <Check size={20} className="text-black dark:text-white" />}
        </div>
    </div>
);

const SettingItem: React.FC<{ icon: React.ReactNode, label: string, subLabel?: string, onClick: () => void, highlight?: boolean }> = ({ icon, label, subLabel, onClick, highlight }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0">
        <div className="flex items-center space-x-4">
            <div className={`p-2.5 rounded-xl ${highlight ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>{icon}</div>
            <div className="text-left"><p className="font-medium text-gray-900 dark:text-white">{label}</p>{subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}</div>
        </div>
        <ChevronRight size={18} className="text-gray-300" />
    </button>
);

export default SettingsPage;
