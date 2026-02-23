"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import { Trash2 } from "lucide-react";

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
    <aside className="hidden lg:flex w-72 shrink-0 flex-col  dark:border-brand-400/20 bg-gray-50/50 dark:bg-white/[0.02]">
      <nav className="flex-1 overflow-y-auto hide-scrollbar">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
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
                  isActive ? "text-brand-100" : "text-gray-500 dark:text-gray-400 opacity-100"
                ].join(" ")}>
                  Step {step.id}
                </span>
               {isCompleted && !isActive && (
  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 shadow-sm ring-1 ring-emerald-700/20">
    <Check size={14} strokeWidth={3.5} className="text-white" />
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
  const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;

  return (
    <div className="lg:hidden w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* ── STEP PILLS ROW ── */}
      <nav className="flex w-full overflow-x-auto hide-scrollbar scroll-smooth px-3 py-2.5 gap-1.5">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const isUnlocked = step.id <= maxCompletedStep + 1;
          const isClickable = isUnlocked && !isActive;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable && !isActive}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={[
                "relative flex items-center gap-1.5 shrink-0 rounded px-2.5 py-1.5 transition-all duration-200 border",
                isActive
                  ? "bg-brand-500 dark:bg-brand-600 border-brand-600 dark:border-brand-500 shadow-sm shadow-brand-500/20"
                  : isCompleted
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                  : isClickable
                  ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-500/5"
                  : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800/50 cursor-not-allowed opacity-40",
              ].join(" ")}
            >
              {/* Step number / check icon */}
              <span className={[
                "flex items-center justify-center w-4 h-4 rounded-sm text-[9px] font-black shrink-0",
                isActive
                  ? "bg-white/20 text-white"
                  : isCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isClickable
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  : "bg-gray-100 dark:bg-gray-800/50 text-gray-400",
              ].join(" ")}>
                {isCompleted && !isActive ? (
                  <Check size={9} strokeWidth={4} />
                ) : (
                  step.id
                )}
              </span>

              {/* Step title */}
              <span className={[
                "text-[10px] font-bold uppercase tracking-tight whitespace-nowrap",
                isActive
                  ? "text-white"
                  : isCompleted
                  ? "text-emerald-700 dark:text-emerald-400"
                  : isClickable
                  ? "text-gray-600 dark:text-gray-300"
                  : "text-gray-400 dark:text-gray-600",
              ].join(" ")}>
                {step.title}
              </span>

              {/* Active: subtle bottom accent */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-white/40" />
              )}
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
        <div className="flex flex-col overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:h-[90vh] min-h-[600px]">

          {/* ── UNIFIED TOP HEADER (spans full width above sidebar + content) ── */}
          <div className="w-full bg-white dark:bg-gray-900 px-6 sm:px-10 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white leading-tight">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {pageSubtitle}
              </p>
            )}
          </div>

          {/* ── BODY ROW: Sidebar + Content ── */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-0">

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

         <div className="flex-1 overflow-y-auto px-6 sm:px-10 hide-scrollbar">

                {/* CURRENT STEP HEADER */}
                <div className="mb-8 pt-6">
                  <h2 className="text-l font-medium text-gray-800 dark:text-white">{current?.title}</h2>
                  {current?.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{current.description}</p>
                  )}
                </div>

                {/* FORM CONTENT */}
                <div className="pb-20">
                  {children}
                </div>
              </div>

              {/* Nav footer */}
              <div className="flex flex-col-reverse gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-5 dark:border-gray-800 dark:bg-white/[0.01] sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-10">
                <Button
                  variant="outline"
                  onClick={onBack}
                  disabled={isFirst}
                  className="w-full sm:w-auto"
                >
                  ← Back
                </Button>

                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <span className="text-xs font-bold tabular-nums text-gray-400 uppercase tracking-widest sm:block">
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

export function FormGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
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
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export function AddItemButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Button variant="outline" onClick={onClick}>
      <span className="text-2xl font-light leading-none">+</span>
      {children}
    </Button>
  );
}