import PushNotificationLayout from "../components/PushNotificationLayout";
import FirebaseConfigForm from "../components/FirebaseConfigForm";
export default function Settings() {
  return (
    <PushNotificationLayout>
      <FirebaseConfigForm />
    </PushNotificationLayout>
  );
}
