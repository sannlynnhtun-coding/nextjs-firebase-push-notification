import nextVitals from "eslint-config-next/core-web-vitals";
const config = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "firebase-test-proj/**",
      "public/firebase-messaging-sw.js",
    ],
  },
];

export default config;
