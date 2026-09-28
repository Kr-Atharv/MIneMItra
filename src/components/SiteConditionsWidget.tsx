import React, { useEffect, useState } from 'react';
import { CloudSun, Wind, MapPin, LocateFixed, RefreshCw, Clock, ThermometerSun, Droplets } from 'lucide-react';
import { useMineLocation } from '../hooks/useMineLocation';
import { fetchMineWeather, fetchMineAqi, WeatherReading, AqiReading, isRateLimited, RATE_LIMIT_MESSAGE } from '../lib/externalDataClient';

interface SiteConditionsWidgetProps {
  mineId: string;
}

const SOURCE_BADGE_TONE: Record<string, string> = {
  'Using device location': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Manually entered': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Default mine coordinates': 'bg-slate-100 text-slate-600 border-slate-200'
};

function aqiTone(aqi: number | null): string {
  if (aqi === null) return 'text-slate-400';
  if (aqi <= 100) return 'text-emerald-700';
  if (aqi <= 200) return 'text-amber-600';
  return 'text-rose-600';
}

/**
 * Step 6 — real weather/AQI for the currently selected mine, sourced via
 * useMineLocation's device -> manual -> static fallback. The active
 * source is always labelled on-screen so it's never ambiguous which one
 * produced the coordinates behind the reading below (spec requirement).
 */
export const SiteConditionsWidget: React.FC<SiteConditionsWidgetProps> = ({ mineId }) => {
  const location = useMineLocation(mineId);
  const [weather, setWeather] = useState<WeatherReading | null>(null);
  const [aqi, setAqi] = useState<AqiReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (location.lat === null || location.lng === null) return;
    setLoading(true);
    Promise.all([fetchMineWeather(location.lat, location.lng), fetchMineAqi(location.city || 'India', location.aqiFallbacks)])
      .then(([w, a]) => {
        setWeather(w);
        setAqi(a);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, location.city]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <CloudSun className="w-4 h-4 text-[#0B6B4A]" />
          <span>Site Conditions</span>
        </div>
        <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded border ${SOURCE_BADGE_TONE[location.sourceLabel]}`}>
          <MapPin className="w-3 h-3" />
          <span>{location.sourceLabel}</span>
          {location.isResolvingDevice && <span className="italic font-normal normal-case">(checking device...)</span>}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            <ThermometerSun className="w-3.5 h-3.5" />
            <span>Weather</span>
            <span className="text-slate-300 font-normal normal-case ml-auto">{weather?.source}</span>
          </div>
          {loading && <div className="text-[11px] text-slate-400">Loading...</div>}
          {!loading && weather && !weather.degraded && (
            <div className="text-xs text-slate-700 space-y-0.5">
              <div className="text-lg font-black text-slate-900">{weather.temperatureC ?? '—'}°C</div>
              <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                <Droplets className="w-3 h-3" /><span>{weather.precipitationMm ?? 0} mm</span>
                <Wind className="w-3 h-3 ml-2" /><span>{weather.windSpeedKmh ?? '—'} km/h</span>
              </div>
            </div>
          )}
          {!loading && weather?.degraded && (
            <div className="text-[11px] text-amber-700 flex items-start space-x-1">
              <Clock className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{isRateLimited(weather.errorCode) ? RATE_LIMIT_MESSAGE : 'Weather temporarily unavailable.'}</span>
            </div>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            <Wind className="w-3.5 h-3.5" />
            <span>Air Quality</span>
            <span className="text-slate-300 font-normal normal-case ml-auto">{aqi?.source}</span>
          </div>
          {loading && <div className="text-[11px] text-slate-400">Loading...</div>}
          {!loading && aqi && !aqi.degraded && (
            <div className="text-xs text-slate-700 space-y-0.5">
              <div className={`text-lg font-black ${aqiTone(aqi.aqi)}`}>{aqi.aqi ?? '—'}</div>
              <div className="text-[11px] text-slate-500">{aqi.pollutant || 'AQI'} • {aqi.station || location.city}</div>
              {aqi.approximate && (
                <div className="text-[10px] text-amber-600 italic">
                  No station for "{aqi.requestedLocation}" — showing nearest regional reading ({aqi.matchedLocation}).
                </div>
              )}
            </div>
          )}
          {!loading && aqi?.degraded && (
            <div className="text-[11px] text-amber-700 flex items-start space-x-1">
              <Clock className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                {isRateLimited(aqi.errorCode)
                  ? RATE_LIMIT_MESSAGE
                  : aqi.errorCode === 'NOT_CONFIGURED'
                  ? 'AQI source not configured (see .env.example).'
                  : aqi.errorCode === 'DEMO_TOKEN_UNUSABLE'
                  ? "WAQI's shared demo token only serves Shanghai sample data — set a real free WAQI_TOKEN in .env for live Indian AQI."
                  : 'AQI temporarily unavailable.'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <button
          onClick={location.retryDeviceLocation}
          className="flex items-center space-x-1 text-slate-500 hover:text-[#0B6B4A]"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Use device location</span>
        </button>
        <span className="text-slate-300">•</span>
        <button
          onClick={() => setShowManualEntry((v) => !v)}
          className="flex items-center space-x-1 text-slate-500 hover:text-[#0B6B4A]"
        >
          <LocateFixed className="w-3 h-3" />
          <span>Enter location manually</span>
        </button>
      </div>

      {showManualEntry && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={location.manualInput}
            onChange={(e) => location.setManualInput(e.target.value)}
            placeholder="e.g. 22.09, 83.13 or 'Korba'"
            className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#004D40]"
          />
          <button
            onClick={() => {
              location.applyManualInput();
              setShowManualEntry(false);
            }}
            className="text-[11px] font-bold px-2.5 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded"
          >
            Apply
          </button>
          {location.sourceLabel === 'Manually entered' && (
            <button
              onClick={location.clearManualInput}
              className="text-[11px] font-semibold px-2 py-1.5 text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};
