import { useState, useEffect } from "react";
import PushNotificationLayout from "../components/PushNotificationLayout";
import Link from "next/link";
import localforage from "localforage";
import { toast } from "react-toastify";
import { safeMessageUrl } from "../utils/notification-url.mjs";
import { firebaseCloudMessaging } from "../utils/firebase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState("Checking…");
  const [connecting, setConnecting] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [token, setToken] = useState(null);

  const [history, setHistory] = useState([]);
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    if (!token) {
      toast.error("FCM Token not available. Please refresh or check settings.");
      return;
    }

    setIsSubscribing(true);
    try {
      const config = await localforage.getItem("firebase_config");
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          topic: newTopic.trim(),
          serviceAccount: config?.serviceAccount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const updatedTopics = [...new Set([...topics, newTopic.trim()])];
        await firebaseCloudMessaging.saveTopics(updatedTopics);
        setTopics(updatedTopics);
        setNewTopic("");
        toast.success(`Subscribed to topic: ${newTopic}`);
      } else {
        toast.error(
          `Subscription failed: ${data.error?.message || data.message || (typeof data.error === "string" ? data.error : "Unknown error")}`,
        );
      }
    } catch (error) {
      console.error("Subscribe Error:", error);
      toast.error("Failed to subscribe to topic");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async (topicName) => {
    if (!token || isSubscribing) return;
    setIsSubscribing(true);
    try {
      const config = await localforage.getItem("firebase_config");
      const response = await fetch("/api/topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          topic: topicName,
          serviceAccount: config?.serviceAccount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const updatedTopics = topics.filter((t) => t !== topicName);
        await firebaseCloudMessaging.saveTopics(updatedTopics);
        setTopics(updatedTopics);
        toast.info(`Unsubscribed from topic: ${topicName}`);
      } else {
        toast.error(
          `Unsubscription failed: ${data.error?.message || data.message || (typeof data.error === "string" ? data.error : "Unknown error")}`,
        );
      }
    } catch (error) {
      console.error("Unsubscribe Error:", error);
      toast.error("Failed to unsubscribe from topic");
    } finally {
      setIsSubscribing(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Clear all saved notifications from this browser?"))
      return;
    try {
      await localforage.removeItem("notification_history");
      setHistory([]);
      toast.info("History cleared");
    } catch (error) {
      toast.error("Could not clear history. Please try again.");
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard!");
    } catch {
      toast.error("Could not copy. Select the token and copy it manually.");
    }
  };
  const connectDevice = async () => {
    setConnecting(true);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status === "granted") {
        const value = await firebaseCloudMessaging.init();
        if (!value)
          throw new Error("Messaging is unavailable in this browser.");
        setToken(value);
        window.dispatchEvent(new Event("fcm-connect"));
      }
    } catch (error) {
      toast.error(error.message || "Could not connect this device.");
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    const refresh = async () => {
      try {
        const [config, savedToken, savedHistory, savedTopics] =
          await Promise.all([
            localforage.getItem("firebase_config"),
            localforage.getItem("fcm_token"),
            localforage.getItem("notification_history"),
            localforage.getItem("fcm_subscribed_topics"),
          ]);
        const status =
          "Notification" in window ? Notification.permission : "Unsupported";
        setPermission(status);
        setHasConfig(!!config);
        setToken(status === "granted" ? savedToken : null);
        setHistory(savedHistory || []);
        setTopics(savedTopics || []);
      } catch {
        toast.error("Could not load saved workspace data.");
      } finally {
        setLoading(false);
      }
    };
    refresh();
    window.addEventListener("fcm-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("fcm-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <PushNotificationLayout>
      <div className="dashboard">
        <header className="page-heading">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>
              Notification center<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground">
              Your messages, devices, and delivery setup. All in one place.
            </p>
          </div>
          <Link href="/settings" className="button-primary">
            Configure Firebase ↗
          </Link>
        </header>
        <section className="status-strip" aria-label="Workspace status">
          <div>
            <span className="eyebrow">FIREBASE</span>
            <strong>
              <span className={`status-dot ${hasConfig ? "ready" : ""}`} />
              {loading
                ? "Checking…"
                : hasConfig
                  ? "Configured"
                  : "Setup needed"}
            </strong>
          </div>
          <div>
            <span className="eyebrow">THIS DEVICE</span>
            <strong>
              {loading
                ? "Checking…"
                : token
                  ? "Token available"
                  : "Not connected"}
            </strong>
          </div>
          <div>
            <span className="eyebrow">SAVED MESSAGES</span>
            <strong>
              {history.length}
              <small> / 50 retained</small>
            </strong>
          </div>
          <div>
            <span className="eyebrow">TOPICS</span>
            <strong>
              {topics.length}
              <small> subscribed</small>
            </strong>
          </div>
        </section>
        {!loading && !hasConfig && (
          <section className="setup-banner">
            <div className="setup-icon" aria-hidden="true">
              ↗
            </div>
            <div>
              <h2>Start with your Firebase project</h2>
              <p>
                Add your web configuration and VAPID key, then connect this
                browser.
              </p>
            </div>
            <Link href="/settings" className="button-primary">
              Set up project →
            </Link>
          </section>
        )}
        <div className="dashboard-grid">
          <section className="panel inbox">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">ACTIVITY</p>
                <h2>
                  Notification inbox{" "}
                  <span className="count">{history.length}</span>
                </h2>
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="button-subtle">
                  Clear history
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="empty-inbox">
                <div className="inbox-illustration" aria-hidden="true">
                  <span>↙</span>
                  <i />
                  <i />
                  <i />
                </div>
                <h3>
                  {loading ? "Loading your inbox…" : "A quiet inbox. For now."}
                </h3>
                <p>
                  Received notifications will appear here.
                  <br />
                  Connect your device and send your first test message.
                </p>
                <a href="#test-guide" className="button-outline">
                  How to send a test ↓
                </a>
              </div>
            ) : (
              <div className="message-list">
                {history.map((msg) => (
                  <article key={msg.id} className="message-row">
                    <div className="message-icon" aria-hidden="true">
                      ↙
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <h3>{msg.title}</h3>
                        <span className="message-type">{msg.receivedAt}</span>
                      </div>
                      <p className="message-body">{msg.body}</p>
                      <div className="message-meta">
                        <time dateTime={msg.timestamp}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </time>
                        {safeMessageUrl(msg.data?.url) && (
                          <a
                            href={safeMessageUrl(msg.data.url)}
                            className="text-primary underline"
                          >
                            Open message ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <footer className="panel-footer">
              Stored on this browser · Your latest 50 messages
            </footer>
          </section>
          <aside className="space-y-5">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CONNECTION</p>
                  <h2>This device</h2>
                </div>
                <span className={`status-dot ${token ? "ready" : ""}`} />
              </div>
              <div className="panel-content">
                <p className="text-sm text-muted-foreground mb-4">
                  {token
                    ? "Use this token to send a test to this browser."
                    : "Allow notifications to receive messages on this browser."}
                </p>
                <p className="permission-label">
                  Permission <strong>{permission}</strong>
                </p>
                {token ? (
                  <>
                    <code className="token-preview">{token}</code>
                    <button
                      onClick={copyToken}
                      className="button-outline w-full"
                    >
                      Copy device token ↗
                    </button>
                  </>
                ) : (
                  <button
                    onClick={connectDevice}
                    disabled={
                      !hasConfig || connecting || permission === "Unsupported"
                    }
                    className="button-primary w-full"
                  >
                    {connecting ? "Connecting…" : "Enable notifications"}
                  </button>
                )}
                {permission === "denied" && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Allow notifications in your browser’s site settings, then
                    try again.
                  </p>
                )}
              </div>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">SUBSCRIPTIONS</p>
                  <h2>Topics</h2>
                </div>
                <span className="count">{topics.length}</span>
              </div>
              <div className="panel-content">
                <p className="text-sm text-muted-foreground mb-4">
                  Group messages by the topics you follow.
                </p>
                <form onSubmit={handleSubscribe} className="topic-form">
                  <label htmlFor="topic" className="sr-only">
                    Topic name
                  </label>
                  <input
                    id="topic"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. product-updates"
                    required
                    disabled={!token || isSubscribing}
                  />
                  <button
                    className="button-primary"
                    disabled={!token || isSubscribing}
                  >
                    {isSubscribing ? "…" : "Add"}
                  </button>
                </form>
                {topics.length ? (
                  <ul className="topic-list">
                    {topics.map((topic) => (
                      <li key={topic}>
                        <span className="break-all"># {topic}</span>
                        <button
                          disabled={isSubscribing}
                          className="button-subtle"
                          onClick={() => handleUnsubscribe(topic)}
                          aria-label={`Unsubscribe from ${topic}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground py-5">
                    No topics yet. Add one when connected.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Topic changes require a service account in Settings.
                </p>
              </div>
            </section>
          </aside>
        </div>
        <section id="test-guide" className="test-guide">
          <div>
            <p className="eyebrow">QUICK START</p>
            <h2>Your first notification</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Three steps from setup to delivery.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Connect your project</h3>
                <p>
                  Add your Firebase configuration in{" "}
                  <Link href="/settings" className="underline">
                    Settings
                  </Link>
                  .
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Enable this device</h3>
                <p>Allow notifications and copy your device token.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Send a test message</h3>
                <p>
                  Paste the token in{" "}
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Firebase Console ↗
                  </a>{" "}
                  under Messaging → Send test message.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <footer className="workspace-footer">
          <span>FPND / Firebase Cloud Messaging</span>
          <span>Built for a quieter workflow.</span>
        </footer>
      </div>
    </PushNotificationLayout>
  );
}
