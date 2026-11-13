import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>FPND · Notification center</title>
        <meta name="application-name" content="FPND" />
        <meta name="theme-color" content="#FF9100" />
        <meta name="color-scheme" content="light dark" />

        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="16x16 32x32 48x48" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png?v=2"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png?v=2"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png?v=2"
        />
        <link rel="manifest" href="/manifest.webmanifest?v=2" />
        <meta
          name="description"
          content="Configure Firebase, connect your browser, and manage push notifications in one focused workspace."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FPND · Notification center" />
        <meta
          property="og:description"
          content="Your Firebase notification workspace."
        />
        <meta
          property="og:image"
          content="https://nextjs-firebase-push-notification.vercel.app/social-card.png?v=2"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="FPND notification bubble logo and Firebase Push Notification Demo"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FPND · Notification center" />
        <meta
          name="twitter:image"
          content="https://nextjs-firebase-push-notification.vercel.app/social-card.png?v=2"
        />
        <meta name="twitter:image:alt" content="FPND notification workspace" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;
