import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, Eye, Info, RefreshCw, Waves } from 'lucide-react';
import { apiClient, MonitoringData } from '../../services/api/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';

function formatMeasurement(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'Unavailable';
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : 'Unavailable';
}

function formatObservedAt(value: string | null | undefined): string {
  if (!value) return 'No observation data yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Observation time unavailable' : date.toLocaleString();
}

interface LiveMonitoringModeProps {
  villageId: string | null;
}

export const LiveMonitoringMode: React.FC<LiveMonitoringModeProps> = ({ villageId }) => {
  const { t } = useLanguage();
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshMonitoring = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    if (!villageId) {
      setMonitoring(null);
      setLoadError('No configured village is within 50 km of the selected location.');
      setIsRefreshing(false);
      return;
    }

    try {
      setMonitoring(await apiClient.getMonitoringData(villageId));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Monitoring data could not be loaded.'
      );
      setMonitoring(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [villageId]);

  useEffect(() => {
    void refreshMonitoring();
    if (!autoRefreshEnabled || !villageId) return;

    const interval = window.setInterval(() => {
      void refreshMonitoring();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [autoRefreshEnabled, refreshMonitoring, villageId]);

  const weather = monitoring?.weather ?? null;
  const river = monitoring?.river ?? null;
  const observationTime =
    weather && river
      ? new Date(weather.observed_at) > new Date(river.observed_at)
        ? weather.observed_at
        : river.observed_at
      : weather?.observed_at ?? river?.observed_at;
  const hasObservations = Boolean(weather || river);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasObservations ? 'animate-ping bg-blue-400' : 'bg-slate-300'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                hasObservations ? 'bg-blue-600' : 'bg-slate-400'
              }`} />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {t.liveTelemetry}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Info className="w-3 h-3" />
            <span>{hasObservations ? 'Observed data' : 'Unavailable'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-400">
            Last observed: {formatObservedAt(observationTime)}
          </span>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[11px] font-medium">{t.autoRefresh}</span>
            </label>

            <button
              onClick={() => void refreshMonitoring()}
              disabled={isRefreshing}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
              title={t.manualRefresh}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
        {loadError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            Monitoring data unavailable: {loadError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rainfall</span>
            <CloudRain className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatMeasurement(weather?.rainfall_mm)}{weather?.rainfall_mm == null ? '' : ' mm'}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Latest</span>
          </div>
          <p className="text-[10px] text-slate-400">{weather?.source ?? 'Source not reported'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>River level</span>
            <Waves className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatMeasurement(river?.water_level_m)}{river ? ' m' : ''}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Latest</span>
          </div>
          <p className="text-[10px] text-slate-400">{river?.source ?? 'Source not reported'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Temperature</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatMeasurement(weather?.temperature_c)}{weather?.temperature_c == null ? '' : ' °C'}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Latest</span>
          </div>
          <p className="text-[10px] text-slate-400">{weather?.source ?? 'Source not reported'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Humidity</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              {formatMeasurement(weather?.humidity_percent)}{weather?.humidity_percent == null ? '' : '%'}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Latest</span>
          </div>
          <p className="text-[10px] text-slate-400">{weather?.source ?? 'Source not reported'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Observation sources
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Weather observations</span>
            <span className="text-[10px] font-bold text-slate-500">
              {weather ? weather.source ?? 'Source not reported' : 'Unavailable'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="font-semibold text-slate-800 dark:text-slate-200">River gauge observations</span>
            <span className="text-[10px] font-bold text-slate-500">
              {river ? river.source ?? 'Source not reported' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {t.activeAdvisories}
        </h4>
        <div className="space-y-2 text-xs">
          {monitoring?.alerts.length ? (
            monitoring.alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-2.5 border rounded-xl ${
                  alert.severity === 'critical' || alert.severity === 'warning'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                    : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200'
                }`}
              >
                <p className="font-bold">{alert.title}</p>
                <p className="text-[11px] mt-0.5">{alert.description}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">
              {loadError ? 'Public advisories are unavailable.' : 'No active public advisories.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
