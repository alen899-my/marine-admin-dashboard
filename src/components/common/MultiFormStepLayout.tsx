"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import { Trash2 } from "lucide-react";
// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface StepConfig {
  id: number;
  title: string;
  description?: string;
}

interface MultiStepFormLayoutProps {
  steps: StepConfig[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (stepId: number) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isNextDisabled?: boolean;
  submitLabel?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  children: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────
// DESKTOP SIDEBAR (Internal)
// ─────────────────────────────────────────────────────────────────
function StepSidebar({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
}: {
  steps: StepConfig[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (id: number) => void;
}) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
          Application Steps
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto hide-scrollbar">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          
          // Logic: A step is completed ONLY if it has been "submitted/saved" (is in the array)
          const isCompleted = completedSteps.includes(step.id);
          
          // Logic: Furthest point reached is the highest ID in completedSteps + 1
          const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
          
          // Logic: Clickable if it's a step they've already done (backward) 
          // OR the very next step they are allowed to do (forward).
          const isUnlocked = step.id <= maxCompletedStep + 1;
          const isClickable = isUnlocked && !isActive;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable && !isActive}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={[
                "flex w-full flex-col border-b border-gray-100 px-6 py-4 text-left transition-colors dark:border-gray-800/50",
                isActive 
                  ? "bg-brand-500 text-white dark:bg-brand-600" 
                  : isClickable 
                  ? "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50 cursor-pointer" 
                  : "bg-gray-100/30 text-gray-400 cursor-not-allowed opacity-60 dark:bg-transparent"
              ].join(" ")}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className={[
                  "text-[10px] font-bold uppercase tracking-wider",
                  isActive 
                    ? "text-brand-100" 
                    : "text-gray-500 dark:text-gray-400 opacity-100"
                ].join(" ")}>
                  Step {step.id}
                </span>
                {isCompleted && !isActive && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Check size={10} strokeWidth={4} />
                  </div>
                )}
              </div>

              <span className={[
                "mt-1 text-[13px] font-bold uppercase tracking-tight",
                isActive ? "text-white" : "text-gray-700 dark:text-gray-200"
              ].join(" ")}>
                {step.title}
              </span>

              {step.description && (
                <p className={[
                  "mt-1 text-[11px] leading-tight font-medium",
                  isActive ? "text-brand-50/80" : "text-gray-400"
                ].join(" ")}>
                  {step.description}
                </p>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────
// MOBILE PROGRESS
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// MOBILE PROGRESS (Updated with Tabs)
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// FINAL MOBILE PROGRESS (Desktop-Sidebar Aligned)
// ─────────────────────────────────────────────────────────────────

function MobileProgress({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
}: {
  steps: StepConfig[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (id: number) => void;
}) {
  return (
    <div className="lg:hidden sticky top-0 z-30 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <nav className="flex w-full overflow-x-auto hide-scrollbar scroll-smooth">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          
          // Logic: Only marked completed if it was explicitly submitted/saved
          const isCompleted = completedSteps.includes(step.id);
          
          // Logic: Calculate the furthest allowed step (last submitted + 1)
          const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
          
          // Logic: Clickable only if unlocked (backward or immediate next) and not current
          const isUnlocked = step.id <= maxCompletedStep + 1;
          const isClickable = isUnlocked && !isActive;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable && !isActive}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={[
                "relative flex flex-1 min-w-[130px] flex-col items-center justify-center px-3 py-4 transition-all duration-200 min-h-[80px] border-r border-gray-100 dark:border-gray-800 last:border-r-0",
                isActive 
                  ? "bg-brand-500 text-white dark:bg-brand-600" 
                  : isClickable 
                  ? "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50" 
                  : "bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed dark:bg-transparent"
              ].join(" ")}
            >
              {/* Step Header: Counter & Status */}
              <div className="flex w-full items-center justify-between px-1 mb-1">
                <span className={[
                  "text-[9px] font-bold uppercase tracking-wider",
                  isActive ? "text-brand-100" : "text-gray-500 dark:text-gray-400"
                ].join(" ")}>
                  Step {step.id}
                </span>
              </div>

              {/* Step Title: Wrapped and Bold */}
              <span className={[
                "w-full text-center text-[11px] font-bold uppercase tracking-tight leading-tight whitespace-normal break-words",
                isActive ? "text-white" : "text-gray-700 dark:text-gray-200"
              ].join(" ")}>
                {step.title}
              </span>

              {/* Bottom indicator line */}
              <div className={[
                "absolute bottom-0 left-0 h-1 w-full transition-all",
                isActive 
                  ? "bg-white/30" 
                  : isCompleted 
                  ? "bg-emerald-500" 
                  : "bg-transparent"
              ].join(" ")} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────────

export default function MultiStepFormLayout({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  isNextDisabled = false,
  submitLabel = "Submit Application",
  pageTitle = "Application Form",
  pageSubtitle,
  children,
}: MultiStepFormLayoutProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === steps.length;
  const current = steps.find((s) => s.id === currentStep);

  return (
    <div className="min-h-screen py-4 sm:py-8 lg:py-6 bg-gray-50/50 dark:bg-black/20 px-4">
      <div className="">
        {/* MAIN CONTAINER */}
        <div className="flex flex-col lg:flex-row overflow-hidden rounded border border-gray-200 bg-white  dark:border-gray-800 dark:bg-gray-900 lg:h-[90vh] min-h-[600px]">
          
          <StepSidebar
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={onStepClick}
          />

          <div className="flex flex-1 flex-col min-w-0">
<MobileProgress 
    steps={steps} 
    currentStep={currentStep} 
    completedSteps={completedSteps}
    onStepClick={onStepClick}
  />

  {/* 1. REMOVED py-10 FROM HERE to prevent the "gap" at the top */}
  <div className="flex-1 overflow-y-auto px-6 sm:px-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
    
  {/* 2. STICKY HEADER - Compact Version */}
<div className="sticky top-0 z-20 bg-white dark:bg-gray-900 -mx-6 sm:-mx-10 px-6 sm:px-10 pt-4 pb-3 mb-6 border-b border-gray-100 dark:border-gray-800 ">
  <h1 className="text-2xl font-medium text-gray-900 dark:text-white leading-tight">
    {pageTitle}
  </h1>
  {pageSubtitle && (
    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
      {pageSubtitle}
    </p>
  )}
</div>

    {/* 3. CURRENT STEP HEADER */}
    <div className="mb-8">
      <h2 className="text-l font-medium text-gray-800 dark:text-white">{current?.title}</h2>
      {current?.description && (
         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{current.description}</p>
      )}
    </div>
    
    {/* 4. FORM CONTENT */}
    <div className="pb-20"> {/* Added padding bottom here instead */}
      {children}
    </div>
  </div>
{/* Nav footer */}
<div className="flex flex-col-reverse gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-5 dark:border-gray-800 dark:bg-white/[0.01] sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-10">
  
  <Button 
    variant="outline" 
    onClick={onBack} 
    disabled={isFirst}
    className="w-full sm:w-auto" // Full width on mobile, auto on desktop
  >
    ← Back
  </Button>

  <div className="flex flex-col items-center gap-3 sm:flex-row">
    <span className="text-xs font-bold tabular-nums text-gray-400 uppercase tracking-widest sm:block">
      {/* Removed 'hidden' so it shows on mobile, or keep it if you want it desktop-only */}
      Step {currentStep} of {steps.length}
    </span>
    
    {isLast ? (
      <Button 
        variant="primary" 
        onClick={onSubmit} 
        disabled={isSubmitting || isNextDisabled}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Submitting…" : submitLabel}
      </Button>
    ) : (
      <Button 
        variant="primary" 
        onClick={onNext} 
        disabled={isNextDisabled}
        className="w-full sm:w-auto"
      >
        Save & Continue →
      </Button>
    )}
  </div>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

export function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Only render this div if title or description exists */}
      {(title || description) && (
        <div className="border-b border-gray-100 pb-3 dark:border-gray-800">
          {title && (
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {title}
            </h4>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="pt-1">
        {children}
      </div>
    </div>
  );
}

export function FormGrid({ cols = 2, children }: { cols?: 1|2 | 3; children: React.ReactNode }) {
  return (
    <div className={`grid grid-cols-1 gap-5 ${cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
      {children}
    </div>
  );
}
export function RepeatCard({
  index,
  label,
  onRemove,
  canRemove = true,
  children,
}: {
  index: number;
  label: string;
  onRemove: () => void;
  canRemove?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            {label} {index + 1}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            aria-label="Remove item"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
      
      {/* The Grid Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
export function AddItemButton({ 
  onClick, 
  children 
}: { 
  onClick: () => void; 
  children?: React.ReactNode; 
}) {
  return (
    <Button
     variant="outline"
      onClick={onClick}
      
    >
      <span className="text-2xl font-light leading-none">+</span>
      {children}
    </Button>
  );
}
