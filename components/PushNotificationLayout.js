import React, { useEffect } from "react";
import * as firebase from "firebase/app";
import "firebase/messaging";
import { firebaseCloudMessaging } from "../utils/firebase";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/router";

function PushNotificationLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    setToken();

    // Event listener that listens for the push notification event in the background
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("event for the service worker", event);
        console.log(event.data.firebaseMessaging.payload.notification);
        const message = event.data.firebaseMessaging.payload;
        toast(
            <div onClick={() => handleClickPushNotification(message?.data?.url)}>
              <h5>{message?.notification?.title}</h5>
              <h6>{message?.notification?.body}</h6>
            </div>,
            {
              closeOnClick: false,
            }
        );
      });
    }

    // Calls the getMessage() function if the token is there
    async function setToken() {
      try {
        const token = await firebaseCloudMessaging.init();
        if (token) {
          console.log("token", token);

          getMessage();

          toast(
              <div onClick={() => {copiedMessageToast(token)}} style={{cursor: 'pointer'}}>
                <h5>Token</h5>
                <h6>{token}</h6>
              </div>,
              {
                closeOnClick: false,
              }
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
  });

  function copiedMessageToast(token){
    navigator.clipboard.writeText(token);
    toast(
        <div>
          <h5>copied to clipboard!</h5>
        </div>,
        {
          closeOnClick: false,
        }
    );
  }

  // Handles the click function on the toast showing push notification
  const handleClickPushNotification = (url) => {
    router.push(url);
  };

  // Get the push notification message and triggers a toast to show it
  function getMessage() {
    const messaging = firebase.messaging();
    messaging.onMessage((message) => {
      console.log({message});
      toast(
        <div onClick={() => handleClickPushNotification(message?.data?.url)}>
          <h5>{message?.notification?.title}</h5>
          <h6>{message?.notification?.body}</h6>
        </div>,
        {
          closeOnClick: false,
        }
      );
    });
  }

  return (
    <>
      <ToastContainer />
      {children}
    </>
  );
}

export default PushNotificationLayout;
