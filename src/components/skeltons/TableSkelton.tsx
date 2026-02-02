import React from "react";

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
}

export default function TableSkeleton({ 
  rowCount = 10, 
  columnCount = 5 
}: TableSkeletonProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-white/10 animate-pulse">
      {/* 1. SCROLL WRAPPER 
         Matches the 'min-w-[1200px]' from your table to ensure 
         horizontal scroll appears if needed.
      */}
      <div className="min-w-[1200px] w-full">
        
        {/* 2. HEADER SKELETON 
           Matches the h-10 (40px) height of your real header.
           Using a subtle gray instead of brand-500 to indicate loading state.
        */}
        <div className="h-10 bg-gray-100 dark:bg-white/5 flex items-center px-5 border-b border-gray-200 dark:border-white/10">
          {Array(columnCount).fill(0).map((_, i) => (
            <div key={`header-${i}`} className="flex-1 px-5">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 opacity-50" />
            </div>
          ))}
          {/* Action Column Placeholder */}
          <div className="w-32 px-5">
             <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 opacity-50" />
          </div>
        </div>

        {/* 3. BODY ROWS 
           Alternating colors match your table's zebra striping.
        */}
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {Array(rowCount).fill(0).map((_, rowIndex) => (
            <div 
              key={`row-${rowIndex}`} 
              className={`flex items-center h-[58px] px-5 ${
                rowIndex % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50 dark:bg-white/[0.02]"
              }`}
            >
              {Array(columnCount).fill(0).map((_, colIndex) => (
                <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 px-5">
                  <div 
                    className={`h-4 bg-gray-200 dark:bg-gray-800 rounded ${
                      // Randomize widths slightly for realism
                      colIndex === 0 ? "w-8" : colIndex === 1 ? "w-32" : "w-20"
                    }`} 
                  />
                </div>
              ))}
              
              {/* Action Buttons Placeholder (Eye, Pen, Trash) */}
              <div className="w-32 px-5 flex gap-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* 4. PAGINATION FOOTER SKELETON 
           Matches the sticky bottom bar style.
        */}
        <div className="h-14 bg-brand-50 dark:bg-slate-900 border-t dark:border-gray-700 flex justify-center items-center gap-2">
           <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
           <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
           <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

      </div>
    </div>
  );
}