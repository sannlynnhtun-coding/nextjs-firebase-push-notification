import { useEffect, useState } from "react";
import { onMessage } from "firebase/messaging";
import localforage from "localforage";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import { firebaseCloudMessaging } from "../utils/firebase";
import { safeMessageUrl } from "../utils/notification-url.mjs";

export default function PushNotificationLayout({ children }) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    let disposed = false;
    let unsubscribe;
    let starting = false;
    async function connect() {
      if (starting) return;
      starting = true;
      try {
        const config = await localforage.getItem("firebase_config");
        if (!config || disposed) return;
        await firebaseCloudMessaging.init();
        if (disposed) return;
        window.dispatchEvent(new Event("fcm-updated"));
        const messaging = firebaseCloudMessaging.getMessaging();
        if (messaging && !unsubscribe)
          unsubscribe = onMessage(messaging, async (payload) => {
            try {
              const history =
                (await localforage.getItem("notification_history")) || [];
              const message = {
                id: payload.messageId || crypto.randomUUID(),
                title: payload.notification?.title || "Untitled notification",
                body: payload.notification?.body || "",
                data: payload.data || {},
                timestamp: new Date().toISOString(),
                receivedAt: "Foreground",
              };
              await localforage.setItem(
                "notification_history",
                [message, ...history].slice(0, 50),
              );
              window.dispatchEvent(new Event("fcm-updated"));
              const url = safeMessageUrl(message.data.url);
              toast(
                <div>
                  <strong>{message.title}</strong>
                  <p>{message.body}</p>
                  {url && (
                    <a className="underline" href={url}>
                      Open message ↗
                    </a>
                  )}
                </div>,
              );
            } catch {
              toast.error("Could not save this notification.");
            }
          });
      } catch {
        if (!disposed)
          toast.error(
            "Could not connect to Firebase. Check your settings and try again.",
          );
      } finally {
        starting = false;
      }
    }
    const background = (event) => {
      if (event.data?.firebaseMessaging)
        window.dispatchEvent(new Event("fcm-updated"));
    };
    connect();
    navigator.serviceWorker?.addEventListener("message", background);
    window.addEventListener("fcm-connect", connect);
    return () => {
      cancelAnimationFrame(frame);
      disposed = true;
      unsubscribe?.();
      navigator.serviceWorker?.removeEventListener("message", background);
      window.removeEventListener("fcm-connect", connect);
    };
  }, []);
  function toggleTheme() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* Theme still works without persistence. */
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <nav className="app-nav" aria-label="Main navigation">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <Image src="/logo.svg" alt="" width="28" height="28" />
            <strong>FPND</strong>
            <span>/ console</span>
          </Link>
          <div className="nav-links">
            <Link
              href="/"
              aria-current={router.pathname === "/" ? "page" : undefined}
            >
              Overview
            </Link>
            <Link
              href="/settings"
              aria-current={
                router.pathname === "/settings" ? "page" : undefined
              }
            >
              Settings
            </Link>
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
          </button>
        </div>
      </nav>
      <main id="main-content">
        <ToastContainer theme={isDark ? "dark" : "light"} position="bottom-right" limit={3} autoClose={4000} />
        {children}
      </main>
    </div>
  );
}
