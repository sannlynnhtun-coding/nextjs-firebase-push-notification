import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(
  new URL("../public/firebase-messaging-sw.js", import.meta.url),
  "utf8",
);

test("service worker matches the browser SDK and avoids duplicate listeners and notifications", async () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.ok(
    source.includes(
      `/firebasejs/${manifest.dependencies.firebase.replace("^", "")}/`,
    ),
  );
  const events = {};
  let background;
  let registrations = 0;
  let shown = 0;
  let broadcasts = 0;
  const config = { projectId: "test-project" };
  const indexedDB = {
    open() {
      const request = {};
      queueMicrotask(() =>
        request.onsuccess({
          target: {
            result: {
              close() {},
              transaction() {
                const tx = {
                  objectStore() {
                    return {
                      get(key) {
                        const req = {};
                        queueMicrotask(() => {
                          req.result = key === "firebase_config" ? config : [];
                          req.onsuccess();
                        });
                        return req;
                      },
                      put() {
                        queueMicrotask(() => tx.oncomplete());
                        return {};
                      },
                    };
                  },
                };
                return tx;
              },
            },
          },
        }),
      );
      return request;
    },
  };
  const context = vm.createContext({
    importScripts() {},
    indexedDB,
    console,
    firebase: {
      apps: [{}],
      messaging() {
        return {
          onBackgroundMessage(callback) {
            registrations++;
            background = callback;
          },
        };
      },
    },
    self: {
      addEventListener(name, callback) {
        events[name] = callback;
      },
      registration: {
        async showNotification() {
          shown++;
        },
      },
      clients: {
        async matchAll() {
          return [
            {
              postMessage() {
                broadcasts++;
              },
            },
          ];
        },
      },
    },
  });
  vm.runInContext(source, context);
  await new Promise((resolve) => setImmediate(resolve));
  events.message({ data: { type: "FIREBASE_CONFIG", config } });
  assert.equal(registrations, 1);
  await background({ notification: { title: "SDK displays this" } });
  assert.equal(shown, 0);
  await background({ data: { tag: "data-message" } });
  assert.equal(shown, 1);
  assert.equal(broadcasts, 2);
});
