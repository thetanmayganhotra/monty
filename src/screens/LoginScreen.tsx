import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { Button } from "../design/components/Button";
import { ScreenContainer } from "../design/components/Card";
import { ScreenHeader } from "../design/components/ScreenHeader";
import { colors, radii, space, type } from "../design/theme";
import { FIREBASE_CONFIG } from "../config/env";
import { auth } from "../backend/firebaseClient";

/**
 * Phone OTP via Firebase Auth. expo-firebase-recaptcha renders an
 * invisible/visible reCAPTCHA challenge in a WebView, which is what lets
 * this work in managed Expo without ejecting to native Firebase Auth SDKs.
 */
export default function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    if (!auth || !recaptchaRef.current) return;
    setError(null);
    setSending(true);
    try {
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(phone, recaptchaRef.current);
      setVerificationId(id);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't send the code — check the number and try again.");
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async () => {
    if (!auth || !verificationId) return;
    setError(null);
    setVerifying(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      onLoggedIn();
    } catch (err: any) {
      setError(err?.message ?? "Wrong code — try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <FirebaseRecaptchaVerifierModal ref={recaptchaRef} firebaseConfig={FIREBASE_CONFIG} attemptInvisibleVerification />

      <ScreenHeader eyebrow="Welcome" title="Log in to Monty" subtitle="We'll text you a one-time code." />

      {!verificationId ? (
        <>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={styles.input}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label={sending ? "Sending..." : "Send code"} onPress={sendCode} disabled={sending} style={{ marginTop: space(4) }} />
          {sending && <ActivityIndicator color={colors.primary} style={{ marginTop: space(4) }} />}
        </>
      ) : (
        <>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={styles.input}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label={verifying ? "Verifying..." : "Verify & continue"} onPress={confirmCode} disabled={verifying} style={{ marginTop: space(4) }} />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 96, justifyContent: "flex-start" },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space(3.5),
    paddingHorizontal: space(5),
    color: colors.textPrimary,
    ...type.body,
  },
  error: { ...type.caption, color: colors.danger, marginTop: space(3) },
});
