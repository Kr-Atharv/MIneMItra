import React, { useState } from 'react';
import {
  Home,
  FileCheck2,
  ClipboardCheck,
  MapPin,
  BrainCircuit,
  Users,
  FileSpreadsheet,
  ScanText,
  ChevronDown,
  Phone,
  LayoutDashboard
} from 'lucide-react';
import { PageId } from '../types';

export type PortalNavId = PageId | 'contact';

interface NavItem {
  id: PortalNavId;
  label: string;
  icon: React.ElementType;
}

const PRIMARY: NavItem[] = [
  { id: 'dashboard', label: 'Operations', icon: LayoutDashboard },
  { id: 'statutory', label: 'Statutory', icon: FileCheck2 },
  { id: 'inspection', label: 'Inspections', icon: ClipboardCheck },
  { id: 'gis', label: 'GIS Map', icon: MapPin },
  { id: 'governance-overview', label: 'AI Analytics', icon: BrainCircuit },
  { id: 'contractor', label: 'Workforce', icon: Users }
];

const MORE: NavItem[] = [
  { id: 'document-intelligence', label: 'Document Intelligence', icon: ScanText },
  { id: 'reports', label: 'Statutory Reports', icon: FileSpreadsheet },
  { id: 'contact', label: 'National Helpdesk', icon: Phone }
];

interface PortalNavProps {
  activePage?: PageId;
  onSelect: (id: PortalNavId) => void;
  variant?: 'landing' | 'app';
}

export const PortalNav: React.FC<PortalNavProps> = ({
  activePage,
  onSelect,
  variant = 'app'
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((item) => item.id === activePage);

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-stretch overflow-x-auto">
        <button
          onClick={() => onSelect(variant === 'landing' ? 'landing' : 'dashboard')}
          className={`shrink-0 px-3 py-2.5 flex items-center ${
            variant === 'landing' && !activePage ? 'text-[#0B6B4A] border-b-[3px] border-[#0B6B4A]' : 'text-slate-600 hover:text-[#0B6B4A]'
          }`}
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>

        {PRIMARY.map((item) => {
          const Icon = item.icon;
          const isActive =
            activePage === item.id ||
            (item.id === 'governance-overview' && (activePage === 'airisk' || activePage === 'ai-risk')) ||
            (item.id === 'dashboard' && variant === 'app' && activePage === 'dashboard');
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`shrink-0 px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-wide flex items-center gap-1.5 border-b-[3px] transition-colors ${
                isActive
                  ? 'text-[#0B6B4A] border-[#0B6B4A] bg-emerald-50/60'
                  : 'text-slate-600 border-transparent hover:text-[#0B6B4A] hover:border-emerald-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div
          className="relative shrink-0"
          onMouseEnter={() => setMoreOpen(true)}
          onMouseLeave={() => setMoreOpen(false)}
        >
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-wide flex items-center gap-1 border-b-[3px] ${
              moreActive
                ? 'text-[#0B6B4A] border-[#0B6B4A] bg-emerald-50/60'
                : 'text-slate-600 border-transparent hover:text-[#0B6B4A]'
            }`}
          >
            Other Services
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {moreOpen && (
            <div className="absolute left-0 top-full z-50 w-64 bg-white border border-slate-200 shadow-xl rounded-b-lg py-1">
              {MORE.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      setMoreOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-[#0B6B4A] flex items-center gap-2"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#0B6B4A]" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
