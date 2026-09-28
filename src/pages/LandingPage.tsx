import React, { useState, useRef, useEffect } from 'react';
import {
  FileCheck2,
  ClipboardCheck,
  MapPin,
  Users,
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
  ShieldAlert,
  FileText,
  Radio,
  Play,
  Pause,
  ChevronDown,
  Clock
} from 'lucide-react';
import { PageId } from '../types';
import { IndiaEmblem, CoalguardLogo } from '../components/OfficialLogos';
import { PortalNav, PortalNavId } from '../components/PortalNav';

interface LandingPageProps {
  onNavigate: (page: PageId) => void;
  onOpenAuth: (initialRole?: string) => void;
  onOpenCircularModal: () => void;
  onSelectLanguage?: (lang: 'en' | 'hi') => void;
  currentLanguage?: 'en' | 'hi';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenAuth,
  onOpenCircularModal,
  onSelectLanguage,
  currentLanguage = 'en'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [isMuted] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [nowStamp, setNowStamp] = useState('');
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => setIsVideoPlaying(false));
      }
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setNowStamp(
        now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
          '  |  ' +
          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) +
          ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsVideoPlaying(true);
      } else {
        video.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handlePortalNav = (id: PortalNavId) => {
    if (id === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (id === 'contact') {
      document.getElementById('national-helpdesk')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    onNavigate(id);
  };

  const subsidiaries = [
    { code: 'ECL', name: 'Eastern Coalfields Limited' },
    { code: 'BCCL', name: 'Bharat Coking Coal Limited' },
    { code: 'CCL', name: 'Central Coalfields Limited' },
    { code: 'WCL', name: 'Western Coalfields Limited' },
    { code: 'SECL', name: 'South Eastern Coalfields Limited' },
    { code: 'MCL', name: 'Mahanadi Coalfields Limited' },
    { code: 'NCL', name: 'Northern Coalfields Limited' },
    { code: 'NEC', name: 'North Eastern Coalfields' }
  ];

  const gatewayCards = [
    {
      id: 'statutory' as PageId,
      title: 'Statutory Compliance',
      subtitle: 'REGISTERS & MANDATES',
      statusNumber: '42',
      statusText: 'Statutory Filings Due',
      icon: FileCheck2
    },
    {
      id: 'inspection' as PageId,
      title: 'Field Audit & Inspections',
      subtitle: 'RUGGED AUDITS',
      statusNumber: '15',
      statusText: 'Active Shift Inspections',
      icon: ClipboardCheck
    },
    {
      id: 'gis' as PageId,
      title: '3D Satellite GIS Map',
      subtitle: 'ORBITAL SURVEILLANCE',
      statusNumber: '18',
      statusText: 'Geo-tagged Points & Alerts',
      icon: MapPin
    },
    {
      id: 'contractor' as PageId,
      title: 'Contractor & Workforce',
      subtitle: 'BIOMETRIC GOVERNANCE',
      statusNumber: '84,210',
      statusText: 'Tracked Workers (98% Bio)',
      icon: Users
    },
    {
      id: 'dashboard' as PageId,
      title: 'Section 22 Alert Centre',
      subtitle: 'STOP-WORK ESCALATIONS',
      statusNumber: '3',
      statusText: 'Active Safety Violations',
      icon: AlertTriangle
    },
    {
      id: 'airisk' as PageId,
      title: 'AI Risk Analytics',
      subtitle: 'PREDICTIVE HAZARDS',
      statusNumber: '92%',
      statusText: 'Compliance Safety Index',
      icon: BrainCircuit
    }
  ];

  const scaleClass = fontScale === 'lg' ? 'text-[16px]' : fontScale === 'sm' ? 'text-[13px]' : 'text-[14px]';

  return (
    <div className={`w-full bg-[#F4F7F5] text-slate-900 overflow-x-hidden ${scaleClass}`}>
      <header
        className={`fixed top-0 inset-x-0 z-40 select-none transition-all duration-300 ${
          scrolled ? 'bg-white shadow-sm' : 'bg-gradient-to-b from-black/70 via-black/35 to-transparent'
        }`}
      >
        <div className={`border-b text-[11px] ${scrolled ? 'bg-[#F8FAF9] border-slate-200 text-slate-600' : 'bg-transparent border-white/10 text-white/80'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`w-3 h-3 ${scrolled ? 'text-[#0B6B4A]' : 'text-emerald-300'}`} />
              <span className="font-medium">{nowStamp}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={() => setFontScale('sm')} className={`px-1 ${fontScale === 'sm' ? 'font-bold' : ''}`}>A-</button>
                <button onClick={() => setFontScale('md')} className={`px-1 ${fontScale === 'md' ? 'font-bold' : ''}`}>A</button>
                <button onClick={() => setFontScale('lg')} className={`px-1 ${fontScale === 'lg' ? 'font-bold' : ''}`}>A+</button>
              </div>
              <button
                onClick={() => onSelectLanguage && onSelectLanguage(currentLanguage === 'en' ? 'hi' : 'en')}
                className={`font-semibold hover:underline ${scrolled ? 'text-[#0B6B4A]' : 'text-white'}`}
              >
                {currentLanguage === 'en' ? 'हिन्दी' : 'English'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <IndiaEmblem size={42} />
            <div className={`h-10 w-px hidden sm:block ${scrolled ? 'bg-slate-200' : 'bg-white/30'}`} />
            <CoalguardLogo size={40} color={scrolled ? '#0B6B4A' : '#ffffff'} />
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`font-black text-lg sm:text-xl tracking-tight ${scrolled ? 'text-[#0B6B4A]' : 'text-white'}`}>COALGUARD</span>
                <span className={scrolled ? 'text-slate-400' : 'text-white/50'}>•</span>
                <span className={`font-semibold text-sm ${scrolled ? 'text-[#16A34A]' : 'text-emerald-300'}`}>MineMitra</span>
              </div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${scrolled ? 'text-slate-500' : 'text-white/70'}`}>
                Ministry of Coal • DGMS Dhanbad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${scrolled ? 'bg-emerald-50 border border-emerald-200 text-[#0B6B4A]' : 'bg-white/15 border border-white/25 text-white'}`}>
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Shift A Active</span>
            </div>
            <button
              onClick={() => onOpenAuth('MINE_MANAGER')}
              className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-extrabold rounded-md shadow-sm transition-colors"
            >
              LOGIN / REGISTER
            </button>
          </div>
        </div>

        <div className={scrolled ? 'block' : 'hidden'}>
          <PortalNav variant="landing" onSelect={handlePortalNav} />
        </div>
      </header>

      <section className="relative w-full h-screen min-h-[100dvh] overflow-hidden bg-slate-950">
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {!videoError ? (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              poster="/assets/videos/coal-mine-poster.jpg"
              className="w-full h-full object-cover"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onError={() => setVideoError(true)}
            >
              <source src="/assets/videos/coal-mine-hero.mp4" type="video/mp4" onError={() => setVideoError(true)} />
              <source src="/assets/videos/coal-mine-hero.webm" type="video/webm" onError={() => setVideoError(true)} />
              Your browser does not support HTML5 video.
            </video>
          ) : (
            <img
              src="/assets/videos/coal-mine-poster.jpg"
              alt="Opencast Coal Mine"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/25" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-16 sm:pb-20 px-4 text-center text-white">
          <p className="text-5xl sm:text-7xl font-black tracking-tight drop-shadow-lg">COALGUARD</p>
          <p className="mt-3 text-lg sm:text-2xl font-semibold text-emerald-200">Safety | Security | Compliance</p>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-white/90 leading-relaxed">
            Every shift, 377 collieries power 1.4B Indian lives. National coal mine safety, statutory compliance and AI analytics under DGMS CMR 2017.
          </p>
          <button
            onClick={() => document.getElementById('landing-content')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/80 hover:text-white"
          >
            Scroll to explore
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>

        <div className="absolute bottom-4 right-4 z-30 flex items-center space-x-2.5 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white text-[11px] shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] text-slate-200 tracking-wider uppercase font-bold">
            Live Opencast Pit Feed
          </span>
          <div className="h-3 w-[1px] bg-white/20" />
          <button onClick={togglePlayPause} className="hover:text-emerald-300 text-slate-300 transition-colors p-0.5 cursor-pointer flex items-center space-x-1">
            {isVideoPlaying ? (
              <>
                <Pause className="w-3 h-3 text-emerald-300" />
                <span className="text-[10px] font-medium hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-300" />
                <span className="text-[10px] font-medium hidden sm:inline">Play</span>
              </>
            )}
          </button>
        </div>
      </section>

      <div id="landing-content">
      <div className="bg-[#E8F5EE] border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs text-[#0B6B4A]">
          <span className="font-medium">
            Official DGMS statutory portal — National Coal Mine Safety Sentinel (CMR 2017). Explore the modern government workspace.
          </span>
          <button
            onClick={() => onOpenAuth('MINE_MANAGER')}
            className="shrink-0 px-3 py-1 bg-white border border-emerald-300 rounded-full font-bold hover:bg-emerald-50"
          >
            Explore portal now
          </button>
        </div>
      </div>

      <section className="bg-white border-b border-slate-200 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0B6B4A]" />
            <span>Integrated Coal India Subsidiaries (377 Operating Collieries):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end">
            {subsidiaries.map((sub) => (
              <span
                key={sub.code}
                className="text-xs font-semibold bg-slate-50 hover:bg-emerald-50 text-slate-800 border border-slate-300 hover:border-emerald-400 px-2.5 py-1 rounded"
                title={sub.name}
              >
                {sub.code}
              </span>
            ))}
            <span className="text-xs font-bold bg-[#0B6B4A] text-white px-2.5 py-1 rounded">100% CIL Active</span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Statutory Safety Governance Gateways</h2>
          <p className="text-sm text-slate-600">
            Choose a module, verify officer credentials, and launch the authenticated workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button onClick={() => onOpenAuth('MINE_MANAGER')} className="px-4 py-2 rounded-full bg-[#0B6B4A] text-white font-bold text-xs">
              I'm a Colliery Manager
            </button>
            <button onClick={() => onOpenAuth('DGMS_INSPECTOR')} className="px-4 py-2 rounded-full bg-[#16A34A] text-white font-bold text-xs">
              I'm a DGMS Inspector
            </button>
            <button onClick={() => onOpenAuth('SAFETY_OFFICER')} className="px-4 py-2 rounded-full border border-[#0B6B4A] text-[#0B6B4A] font-bold text-xs">
              I'm an Overman / Surveyor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gatewayCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onOpenAuth('MINE_MANAGER')}
                className="text-left bg-white border border-slate-200 hover:border-[#0B6B4A] rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-[#0B6B4A]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.subtitle}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0B6B4A]">{card.title}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-[#0B6B4A]">{card.statusNumber}</span>
                  <span className="text-xs text-slate-600">{card.statusText}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0B6B4A]">
                  <span>Login & Enter</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="national-helpdesk" className="bg-emerald-50 border-y border-emerald-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-1.5 bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DGMS STATUTORY DIRECTIVE • SECTION 22 MANDATE</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Monsoon Safety Protocol &amp; Bench Stability Verification (CMR 2017 Reg 106)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              All Opencast Mines must maintain 1:1.5 slope angle, sump dewatering standby pump redundancy of 150%, and continuous laser telemetry across all overburden benches.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenCircularModal}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-[#0B6B4A] rounded-lg text-xs font-bold flex items-center space-x-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>View DGMS Gazette PDF</span>
            </button>
            <button
              onClick={() => onOpenAuth('MINE_MANAGER')}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold"
            >
              Submit Compliance
            </button>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
};
