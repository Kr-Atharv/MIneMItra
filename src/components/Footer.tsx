import React from 'react';
import { Phone, Mail, MapPin, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';
import { PageId } from '../types';
import { DGMSBadge } from './OfficialLogos';

interface FooterProps {
  onNavigate?: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate: _onNavigate }) => {
  return (
    <footer className="w-full bg-[#00382E] text-slate-300 text-xs border-t-2 border-[#1B5E20] select-none mt-auto">
      {/* Upper Grid Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Column 1: Official Government Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 pb-1 border-b border-white/20">
              Official Portals
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>
                <a href="https://india.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>National Portal of India</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://coal.nic.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>Ministry of Coal, GoI</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://dgms.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>DGMS India (Dhanbad)</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://coalindia.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>Coal India Limited (CIL)</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://parivahan.gov.in" target="_blank" rel="noreferrer" className="hover:text-emerald-300 flex items-center space-x-1">
                  <span>MeriPehchan (Parichay SSO)</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Site Map */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 pb-1 border-b border-white/20">
              Site Map & Legal
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><a href="#sitemap" className="hover:text-emerald-300">Portal Hierarchy & Site Index</a></li>
              <li><a href="#disclaimer" className="hover:text-emerald-300">Statutory Disclaimer (CMR 2017)</a></li>
              <li><a href="#privacy" className="hover:text-emerald-300">Data Protection & Privacy Policy</a></li>
              <li><a href="#hyperlink" className="hover:text-emerald-300">Hyperlinking Terms & Policy</a></li>
              <li><a href="#accessibility" className="hover:text-emerald-300">GIGW 3.0 Accessibility Statement</a></li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 pb-1 border-b border-white/20">
              National Helpdesk
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                <span>DGMS Head Office, Sardar Patel Nagar, Dhanbad, Jharkhand - 826001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Toll Free: 1800-11-2026 / 91-8853-22021</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-mono">support@coalguard.gov.in</span>
              </div>
            </div>
          </div>

          {/* Column 4: DGMS Circular Badge */}
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded border border-white/10 text-center">
            <DGMSBadge size={52} />
            <span className="text-[11px] font-bold text-emerald-300 mt-2">
              DGMS CIRCULAR AUDIT
            </span>
            <span className="text-[10px] text-slate-300 font-mono mt-0.5">
              Verified PKI Standards
            </span>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-300 mt-1">
              <CheckCircle className="w-3 h-3" />
              <span>Section 22 Digital Vault</span>
            </div>
          </div>

          {/* Column 5: Important Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 pb-1 border-b border-white/20">
              Important Links
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><a href="#dgms-returns" className="hover:text-emerald-300">DGMS Statutory Returns</a></li>
              <li><a href="#final-reports" className="hover:text-emerald-300">Generate Final Reports</a></li>
              <li><a href="#mines-act" className="hover:text-emerald-300">Mines Act 1952 Gazette</a></li>
              <li><a href="#cmr-rules" className="hover:text-emerald-300">Coal Mines Regulations 2017</a></li>
              <li><a href="#moefcc" className="hover:text-emerald-300">MoEFCC Environmental Clearances</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="bg-[#002821] py-3 px-4 sm:px-6 border-t border-white/10 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <p>
            © 2026 Government Portal • COALGUARD MINEMITRA • Directorate General of Mines Safety. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center space-x-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GIGW & NIC Security Certified</span>
            </span>
            <span>•</span>
            <span>Last Reviewed: 05 Sep 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
