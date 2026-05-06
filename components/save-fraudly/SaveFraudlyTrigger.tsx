"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMobileViewport } from "@/hooks/useMobileViewport";
import { useStandalonePwa } from "@/hooks/useStandalonePwa";
import { getMobileInstallPlatform } from "@/lib/save-fraudly/platform";
import { EN_MESSAGES } from "@/lib/messages.en";

type BeforeInstallPromptEventTyped = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type ModalMode = "desktop" | "ios" | "android" | "other";

const DIALOG_ID = "save-fraudly-dialog";

export type SaveFraudlyTriggerProps = {
  /** `nav` = pill in header; `footer` = text-style link row. */
  variant: "nav" | "footer";
  /** Suffix instance id when multiple triggers exist (nav vs footer). */
  instanceSuffix?: string;
  className?: string;
};

export function SaveFraudlyTrigger({ variant, instanceSuffix = "", className = "" }: SaveFraudlyTriggerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `${DIALOG_ID}-title${instanceSuffix}`;
  const descId = `${DIALOG_ID}-desc${instanceSuffix}`;

  const isMobile = useMobileViewport();
  const standalone = useStandalonePwa();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEventTyped | null>(null);

  const [modal, setModal] = useState<ModalMode | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEventTyped);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (modal) {
      if (!el.open) {
        el.showModal();
        queueMicrotask(() => {
          el.querySelector<HTMLButtonElement>("[data-save-fraudly-primary]")?.focus();
        });
      }
    } else if (el.open) {
      el.close();
    }
  }, [modal]);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const onDialogClose = useCallback(() => {
    setModal(null);
  }, []);

  const onBackdropMouseDown = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.close();
    }
  }, []);

  const handleTriggerClick = useCallback(async () => {
    if (standalone) return;

    if (isMobile && deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch {
        // dismissed or blocked
      }
      setDeferredPrompt(null);
      return;
    }

    if (isMobile) {
      const p = getMobileInstallPlatform();
      if (p === "android") setModal("android");
      else if (p === "ios") setModal("ios");
      else setModal("other");
      return;
    }

    setModal("desktop");
  }, [standalone, isMobile, deferredPrompt]);

  if (standalone) {
    return null;
  }

  const label = isMobile ? EN_MESSAGES.saveFraudly.navCtaMobile : EN_MESSAGES.saveFraudly.navCtaDesktop;

  const navButtonClass =
    "rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-[1px] transition duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-[0.98] md:px-3 md:text-sm";

  const footerButtonClass =
    "font-medium text-slate-700 transition duration-200 hover:text-slate-900 hover:underline decoration-slate-400/40 underline-offset-2";

  const buttonClass = variant === "nav" ? navButtonClass : footerButtonClass;

  const dialogDomId = `${DIALOG_ID}${instanceSuffix}`;

  const title =
    modal === "desktop"
      ? EN_MESSAGES.saveFraudly.desktopTitle
      : modal
        ? EN_MESSAGES.saveFraudly.mobileTitle
        : "";

  const bodyPrimary =
    modal === "desktop"
      ? EN_MESSAGES.saveFraudly.desktopBody
      : modal
        ? EN_MESSAGES.saveFraudly.mobileBodyLead
        : "";

  const bodySteps =
    modal === "ios"
      ? EN_MESSAGES.saveFraudly.iosSteps
      : modal === "android"
        ? EN_MESSAGES.saveFraudly.androidSteps
        : modal === "other"
          ? EN_MESSAGES.saveFraudly.genericMobileSteps
          : null;

  const bodyHint = modal === "desktop" ? EN_MESSAGES.saveFraudly.desktopHint : modal ? EN_MESSAGES.saveFraudly.mobileSupport : "";

  return (
    <>
      <button
        type="button"
        className={`${buttonClass} ${className}`.trim()}
        onClick={() => void handleTriggerClick()}
        aria-haspopup="dialog"
        aria-expanded={Boolean(modal)}
        aria-controls={dialogDomId}
      >
        <span className="whitespace-nowrap">{label}</span>
      </button>

      <dialog
        id={dialogDomId}
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-[100] w-[min(100%,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)] transition-[opacity,transform] duration-200 ease-out backdrop:bg-slate-900/45 backdrop:backdrop-blur-[2px] open:opacity-100 open:shadow-card [&:not([open])]:pointer-events-none [&:not([open])]:opacity-0"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={onDialogClose}
        onMouseDown={onBackdropMouseDown}
      >
        {modal ? (
          <div className="pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <div id={descId} className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>{bodyPrimary}</p>
              {bodySteps ? (
                <p className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 font-medium text-slate-800">{bodySteps}</p>
              ) : null}
              <p className="text-slate-500">{bodyHint}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                data-save-fraudly-primary
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition duration-200 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                onClick={closeModal}
              >
                {EN_MESSAGES.saveFraudly.closeCta}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
