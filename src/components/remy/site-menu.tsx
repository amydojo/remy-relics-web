"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getMenuExternalLinks } from "@/config/site";
import { createBrowserInspectionLogStore } from "@/inspection-log/storage";

import styles from "./site-menu.module.css";

const externalLinks = getMenuExternalLinks();

type SiteMenuProps = {
  className?: string;
  glyph?: "+" | "☰";
};

function ExternalMenuLink({
  href,
  label,
  testId,
}: {
  href: string | null;
  label: string;
  testId: string;
}) {
  if (href === null) {
    return (
      <span
        aria-disabled={true}
        className={styles.disabledLink}
        data-testid={testId}
      >
        {label}
      </span>
    );
  }

  return (
    <a
      className={styles.menuLink}
      data-testid={testId}
      href={href}
      rel="external noopener noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}

export function SiteMenu({ className, glyph = "☰" }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const [inspectionCount, setInspectionCount] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    setInspectionCount(createBrowserInspectionLogStore().list().length);
    setOpen(true);
  }

  function closeForNavigation() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || overlayRef.current === null) {
        return;
      }

      const focusable = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href]:not([aria-disabled="true"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);

      if (first === undefined || last === undefined) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open site menu"
        className={`${styles.trigger} ${className ?? ""}`}
        data-testid="menu-trigger"
        onClick={openMenu}
        ref={triggerRef}
        type="button"
      >
        {glyph}
      </button>

      {open ? (
        <div
          aria-label="Remy Relics menu"
          aria-modal="true"
          className={styles.overlay}
          data-screen="menu"
          data-testid="menu-overlay"
          ref={overlayRef}
          role="dialog"
        >
          <div className={styles.sheet}>
            <button
              aria-label="Close site menu"
              className={styles.close}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              ref={closeRef}
              type="button"
            >
              ×
            </button>
            <p className={styles.employee}>REMY / EMPLOYEE 001</p>

            <nav aria-label="Site" className={styles.navigation}>
              <section className={styles.aboutGroup}>
                <h2>ABOUT</h2>
                <Link
                  className={styles.menuLink}
                  href="/archive"
                  onClick={closeForNavigation}
                >
                  THE ARCHIVE
                </Link>
                <Link
                  className={styles.menuLink}
                  href="/about#remy"
                  onClick={closeForNavigation}
                >
                  REMY
                </Link>
                <Link
                  className={styles.menuLink}
                  href="/about#material-memory"
                  onClick={closeForNavigation}
                >
                  MATERIAL MEMORY
                </Link>
              </section>

              <section className={styles.notesGroup}>
                <h2>FIELD NOTES</h2>
                <span aria-disabled={true} className={styles.disabledLink}>
                  OBSERVATIONS
                </span>
                <span aria-disabled={true} className={styles.disabledLink}>
                  EXPERIMENTS
                </span>
                <span aria-disabled={true} className={styles.disabledLink}>
                  RECOVERY NOTES
                </span>
              </section>

              <section className={styles.elsewhereGroup}>
                <h2>ELSEWHERE</h2>
                <ExternalMenuLink
                  href={externalLinks.instagram}
                  label="INSTAGRAM ↗"
                  testId="menu-instagram"
                />
                <ExternalMenuLink
                  href={externalLinks.etsyShop}
                  label="ETSY SHOP ↗"
                  testId="menu-etsy-shop"
                />
              </section>

              {inspectionCount > 0 ? (
                <section className={styles.logGroup}>
                  <p>CONDITIONAL / LOCAL DEVICE</p>
                  <Link
                    className={styles.logLink}
                    href="/log"
                    onClick={closeForNavigation}
                  >
                    YOUR LOG / {String(inspectionCount).padStart(2, "0")}
                  </Link>
                </section>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
