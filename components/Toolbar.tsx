import React from 'react';
import { Page } from '../App.tsx';
import ScheduleViewToggle from './ScheduleViewToggle.tsx';

interface ToolbarProps {
  onAddJob?: () => void;
  currentMonth: Date;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onGoToToday: () => void;
  onNavigate: (page: Page) => void;
  onSyncToCalendar?: () => void;
  isSyncing?: boolean;
  jobsCount?: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddJob,
  currentMonth,
  onNextMonth,
  onPreviousMonth,
  onGoToToday,
  onNavigate,
  onSyncToCalendar,
  isSyncing = false,
  jobsCount = 0,
}) => {
  const monthYearLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white/80 dark:bg-slate-700/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-600/50 p-2 flex flex-col sm:flex-row items-center gap-4 sticky top-0 z-20">
      <div className="flex-grow flex items-center gap-2">
        <button onClick={onGoToToday} className="rounded-lg border border-slate-300 dark:border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
            Today
        </button>
        <div className="flex items-center gap-1">
            <button onClick={onPreviousMonth} aria-label="Previous month" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
             <button onClick={onNextMonth} aria-label="Next month" className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 w-36 text-center sm:text-left">{monthYearLabel}</h2>
      </div>
      
      <ScheduleViewToggle currentView="calendar" onNavigate={onNavigate} />

      <div className="flex items-center gap-2">
        {onSyncToCalendar && jobsCount > 0 && (
          <button
            onClick={onSyncToCalendar}
            disabled={isSyncing}
            title="Sync all jobs to Google Calendar"
            className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm text-white font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync to Calendar'}
          </button>
        )}

        {onAddJob && (
          <button
              onClick={onAddJob}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-semibold shadow hover:bg-blue-700 transition-colors"
          >
              + Add Job
          </button>
        )}
      </div>
    </div>
  );
};

export default Toolbar;