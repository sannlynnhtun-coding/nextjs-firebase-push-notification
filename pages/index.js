import { useState, useEffect } from "react";
import PushNotificationLayout from "../components/PushNotificationLayout";
import Link from "next/link";
import localforage from "localforage";
import { toast } from "react-toastify";
import { firebaseCloudMessaging } from "../utils/firebase";

export default function Home() {
  const [hasConfig, setHasConfig] = useState(false);
  const [token, setToken] = useState(null);

  const [history, setHistory] = useState([]);
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    checkConfig();
    loadToken();
    loadHistory();
    loadTopics();
  }, []);

  const loadTopics = async () => {
    const savedTopics = await firebaseCloudMessaging.getTopics();
    setTopics(savedTopics);
  };

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
          serviceAccount: config.serviceAccount,
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
        toast.error(`Subscription failed: ${data.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Subscribe Error:", error);
      toast.error("Failed to subscribe to topic");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async (topicName) => {
    if (!token) return;

    try {
      const config = await localforage.getItem("firebase_config");
      const response = await fetch("/api/topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          topic: topicName,
          serviceAccount: config.serviceAccount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const updatedTopics = topics.filter((t) => t !== topicName);
        await firebaseCloudMessaging.saveTopics(updatedTopics);
        setTopics(updatedTopics);
        toast.info(`Unsubscribed from topic: ${topicName}`);
      } else {
        toast.error(`Unsubscription failed: ${data.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Unsubscribe Error:", error);
      toast.error("Failed to unsubscribe from topic");
    }
  };

  const loadHistory = async () => {
    try {
      const savedHistory = await localforage.getItem("notification_history");
      if (savedHistory) {
        setHistory(savedHistory);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const clearHistory = async () => {
    try {
      await localforage.removeItem("notification_history");
      setHistory([]);
      toast.info("History cleared");
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };
  // ... (omitting existing return to find correct insertion point)

  const checkConfig = async () => {
    try {
      const config = await localforage.getItem("firebase_config");
      setHasConfig(!!config);
    } catch (error) {
      console.error("Error checking config:", error);
    }
  };

  const loadToken = async () => {
    try {
      const fcmToken = await localforage.getItem("fcm_token");
      setToken(fcmToken);
    } catch (error) {
      console.error("Error loading token:", error);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  };

  return (
    <PushNotificationLayout onNotificationReceived={loadHistory}>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-warning/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
              Firebase Push Notification Demo
            </h1>
            <p className="text-xl text-muted-foreground">
              Test and receive push notifications from Firebase Cloud Messaging
            </p>
          </div>

          {/* Configuration Status */}
          {!hasConfig && (
            <div className="bg-warning/10 border-l-4 border-warning rounded-lg shadow-lg p-6 mb-8 animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Configuration Required
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Please configure your Firebase settings to enable push notifications.
                  </p>
                  <Link href="/settings">
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                      Go to Settings
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {hasConfig && (
            <div className="bg-success/10 border-l-4 border-success rounded-lg shadow-lg p-6 mb-8 animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Firebase Configured ✓
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your Firebase configuration is set up. You can now receive push notifications.
                  </p>

                  {token ? (
                    <div className="bg-card text-card-foreground rounded-lg p-5 mt-4 border-2 border-success/30 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-base font-bold text-foreground flex items-center">
                          <svg className="w-5 h-5 text-success mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Your FCM Token
                        </p>
                      </div>
                      <div
                        onClick={copyToken}
                        className="bg-muted/60 border-2 border-success/20 rounded-lg p-4 cursor-pointer hover:bg-muted transition-all duration-200 group shadow-sm"
                        title="Click to copy"
                      >
                        <code className="text-sm text-foreground break-all block font-mono leading-relaxed">
                          {token}
                        </code>
                      </div>
                      <div className="mt-4 flex items-start bg-success/10 rounded-lg p-3 border border-success/20">
                        <svg className="w-5 h-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-foreground">
                          <strong>Click the token above to copy it.</strong> Use this in Firebase Console → Cloud Messaging → Send test message.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-warning/10 rounded-lg p-4 mt-4 border border-warning/30">
                      <p className="text-sm text-foreground flex items-start">
                        <svg className="w-5 h-5 text-warning mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>
                          <strong>FCM Token not generated yet.</strong> Please refresh the page or check the <Link href="/settings" className="underline font-semibold">Settings page</Link> to view your token.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Topic Management */}
          {hasConfig && (
            <div className="bg-card text-card-foreground rounded-xl shadow-lg border border-border p-8 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <svg className="h-6 w-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Manage Topics
              </h2>

              <form onSubmit={handleSubscribe} className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Enter topic name (e.g. news)"
                  className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                  disabled={isSubscribing}
                />
                <button
                  type="submit"
                  disabled={isSubscribing || !newTopic.trim()}
                  className="bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center"
                >
                  {isSubscribing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>

              {topics.length === 0 ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                  <p className="text-muted-foreground text-sm">No topics subscribed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topics.map((topic) => (
                    <div key={topic} className="flex justify-between items-center p-3 bg-muted/40 border border-border rounded-lg group hover:border-primary/40 transition-all">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-success rounded-full mr-3"></span>
                        <span className="font-medium text-foreground">{topic}</span>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(topic)}
                        className="text-xs text-destructive hover:font-bold opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Unsubscribe
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-start bg-warning/10 rounded-lg p-3 border border-warning/20">
                <svg className="w-5 h-5 text-warning mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-foreground">
                  <strong>Note:</strong> Topic subscription via the HTTP v1 API requires a <strong>Service Account JSON</strong> to be configured in the Settings page. Topics are also persisted in local storage.
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-card text-card-foreground rounded-xl shadow-lg border border-border p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
              <svg className="h-6 w-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Test Push Notifications
            </h2>
            <ol className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold mr-3">1</span>
                <span>Configure Firebase settings in the <Link href="/settings" className="text-primary hover:underline font-medium">Settings</Link> page</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold mr-3">2</span>
                <span>Copy your FCM token (shown above after configuration)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold mr-3">3</span>
                <span>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Firebase Console</a></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold mr-3">4</span>
                <span>Navigate to <strong>Cloud Messaging</strong> → <strong>Send test message</strong></span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold mr-3">5</span>
                <span>Paste your FCM token and send a test notification</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-success/10 text-success rounded-full flex items-center justify-center font-semibold mr-3">✓</span>
                <span className="font-semibold">You should receive the notification in this app!</span>
              </li>
            </ol>
          </div>

          {/* Notification History */}
          <div className="bg-card text-card-foreground rounded-xl shadow-lg border border-border p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center">
                <svg className="h-6 w-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Notification History
              </h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm text-destructive hover:underline font-medium transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                <p className="text-muted-foreground">No notifications received yet.</p>
                <p className="text-sm text-muted-foreground/80 mt-1">Sent messages will appear here once saved to IndexedDB.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-lg bg-muted/40 border border-border hover:border-primary/40 transition-all duration-200">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-foreground">{msg.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${msg.receivedAt === 'Foreground' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'}`}>
                        {msg.receivedAt}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{msg.body}</p>
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                      <span>{new Date(msg.timestamp).toLocaleString()}</span>
                      {msg.data?.url && (
                        <Link href={msg.data.url} className="text-primary hover:underline font-medium">
                          View Link
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-start bg-info/10 rounded-lg p-3 border border-info/20">
              <svg className="w-5 h-5 text-info mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-foreground">
                Messages are automatically persisted in <strong>IndexedDB</strong> via <code>localforage</code>, ensuring they remain available even after page reloads.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/settings">
              <button className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Settings
              </button>
            </Link>
          </div>
        </div>
      </div>
    </PushNotificationLayout>
  );
}
