import React from "react";
import { Check } from "lucide-react";

export const STEPS = [
  { id: 1, label: "Seafarer Details" },
  { id: 2, label: "Wages" },
  { id: 3, label: "Vessel & Contract" },
];

export function StepBar({
  current,
  completed,
  onStepClick,
}: {
  current: number;
  completed: number[];
  onStepClick?: (id: number) => void;
}) {
  return (
    <div className="flex items-center w-full max-w-full overflow-x-auto custom-scrollbar py-3 pl-1 mb-2">
      {STEPS.map((s, index) => {
        const isActive = s.id === current;
        const isDone = completed.includes(s.id);
        const isPast = s.id < current || isDone;

        return (
          <React.Fragment key={s.id}>
            {/* Step Item */}
            <div 
              onClick={() => onStepClick?.(s.id)}
              className={`
                flex items-center gap-2.5 shrink-0 rounded-full pr-1 sm:pr-3 py-1 -ml-1 pl-1
                ${onStepClick ? 'cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5' : ''}
              `}
            >
              {/* Circle */}
              <div 
                className={`
                  flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[2px] transition-all duration-300 relative
                  ${isActive 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 ring-4 ring-brand-50 dark:ring-brand-500/10' 
                    : isPast
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-400'
                  }
                `}
              >
                {isPast && !isActive ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3.5} />
                ) : (
                  <span className="text-xs sm:text-sm font-bold">{s.id}</span>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`
                  text-xs sm:text-sm font-semibold transition-colors
                  ${isActive ? 'text-gray-900 dark:text-white' : isPast ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}
                `}
              >
                {s.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-4 min-w-[20px] sm:min-w-[40px] flex items-center">
                <div 
                  className={`h-[2px] w-full rounded-full transition-colors duration-500
                    ${s.id < current ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
