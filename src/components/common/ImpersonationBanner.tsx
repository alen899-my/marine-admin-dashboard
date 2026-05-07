"use client";

import { useImpersonation } from "@/hooks/useImpersonation";
import { RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useRef, useState } from "react";

function getInitials(name?: string | null) {
  if (!name) return "S";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRole(role?: string | null) {
  if (!role) return "User";

  return role
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ImpersonationBanner() {
  const { data: session } = useSession();
  const { isImpersonating, loading, stopImpersonation } = useImpersonation();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasPosition, setHasPosition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const suppressOpenRef = useRef(false);

  const userName = session?.user?.fullName;
  const userRole = formatRole(session?.user?.role);
  const userProfilePicture = session?.user?.profilePicture;
  const originalAdminName = session?.impersonation?.originalAdminName;
  const originalAdminRole = formatRole(session?.impersonation?.originalAdminRole);
  const profilePicture = session?.impersonation?.originalAdminProfilePicture;
  const initials = useMemo(() => getInitials(originalAdminName), [originalAdminName]);
  const userInitials = useMemo(() => getInitials(userName), [userName]);

  useEffect(() => {
    if (!isImpersonating) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isImpersonating]);

  useEffect(() => {
    if (!isImpersonating) return;

    const updatePosition = () => {
      const width = isOpen ? 260 : 72;
      const height = isOpen ? 176 : 72;
      const maxX = Math.max(12, window.innerWidth - width - 12);
      const maxY = Math.max(12, window.innerHeight - height - 12);

      setPosition((current) => {
        if (!hasPosition) {
          return { x: maxX, y: maxY };
        }

        return {
          x: Math.min(current.x, maxX),
          y: Math.min(current.y, maxY),
        };
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => window.removeEventListener("resize", updatePosition);
  }, [hasPosition, isImpersonating, isOpen]);

  function startDragging(
    event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!containerRef.current) return;

    const bounds = containerRef.current.getBoundingClientRect();

    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setHasPosition(true);
  }

  function moveDragging(
    event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>
  ) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) > 6) {
      dragState.moved = true;
      suppressOpenRef.current = true;
    }

    const width = containerRef.current?.offsetWidth ?? (isOpen ? 260 : 72);
    const height = containerRef.current?.offsetHeight ?? (isOpen ? 176 : 72);
    const nextX = event.clientX - dragState.offsetX;
    const nextY = event.clientY - dragState.offsetY;

    setPosition({
      x: Math.min(Math.max(12, nextX), Math.max(12, window.innerWidth - width - 12)),
      y: Math.min(Math.max(12, nextY), Math.max(12, window.innerHeight - height - 12)),
    });
  }

  function stopDragging(
    event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>
  ) {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTriggerClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (suppressOpenRef.current) {
      event.preventDefault();
      suppressOpenRef.current = false;
      return;
    }

    setIsOpen(true);
  }

  if (!isImpersonating) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[100000]"
      style={{ left: position.x, top: position.y }}
    >
      {isOpen ? (
        <div className="w-[280px] overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-[0_22px_60px_-24px_rgba(16,24,40,0.35)] dark:border-brand-500/20 dark:bg-gray-900">
          <div className="flex flex-col gap-4 p-4">
            <div
              onPointerDown={startDragging}
              onPointerMove={moveDragging}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              className="flex w-full cursor-move touch-none select-none items-start justify-between gap-3"
            >
              <div
                onPointerDown={startDragging}
                onPointerMove={moveDragging}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                className="flex h-14 w-14 cursor-move touch-none select-none items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              >
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt={originalAdminName || "Spectating admin"}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  Spectator
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {originalAdminName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {originalAdminRole}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                onPointerDown={(event) => event.stopPropagation()}
                className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-brand-500/20 dark:hover:text-brand-300"
                aria-label="Close spectating panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/70">
              <div
                onPointerDown={startDragging}
                onPointerMove={moveDragging}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                className="flex h-12 w-12 cursor-move touch-none select-none items-center justify-center overflow-hidden rounded-2xl bg-white text-sm font-semibold text-brand-700 dark:bg-gray-900 dark:text-brand-300"
              >
                {userProfilePicture ? (
                  <Image
                    src={userProfilePicture}
                    alt={userName || "Spectated user"}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  userInitials
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  Spectating
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {userRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={stopImpersonation}
              onPointerDown={(event) => event.stopPropagation()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              {loading ? "Switching back..." : "Switch Back"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTriggerClick}
          onPointerDown={startDragging}
          onPointerMove={moveDragging}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className="group relative flex h-[72px] w-[72px] touch-none select-none items-center justify-center rounded-full border border-brand-200 bg-brand-500 text-white shadow-2xl transition duration-200 hover:scale-[1.03] hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200 dark:border-brand-500/20 dark:focus:ring-brand-500/20"
          aria-label="Open spectating panel"
        >
          <div className="absolute inset-[7px] overflow-hidden rounded-full border border-white/20 bg-brand-400/40">
            {profilePicture ? (
              <Image
                src={profilePicture}
                alt={originalAdminName || "Spectating admin"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base font-bold tracking-wide">
                {initials}
              </div>
            )}
          </div>

          <span className="absolute -bottom-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-lg transition group-hover:-translate-y-0.5 dark:border-brand-500/20 dark:bg-gray-900 dark:text-brand-300">
            Spectating
          </span>
        </button>
      )}
    </div>
  );
}
