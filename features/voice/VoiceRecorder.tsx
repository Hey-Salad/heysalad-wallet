import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import HSButton from "@/components/HSButton";
import Colors from "@/constants/colors";
import { transcribeAudio } from "@/utils/ai";

let Audio: typeof import("expo-av").Audio | null = null;

type Props = {
  onTranscript: (text: string) => void;
};

type RecordingState = "idle" | "recording" | "processing" | "error";

const VoiceRecorder: React.FC<Props> = ({ onTranscript }) => {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeRecordingRef = useRef<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (Platform.OS !== "web") {
        try {
          const mod = await import("expo-av");
          Audio = mod.Audio;
        } catch (e) {
          console.error("[Voice] Failed to load expo-av", e);
        }
      }
    };
    load();
  }, []);

  const isProcessing = useMemo(() => state === "processing", [state]);
  const isRecording = useMemo(() => state === "recording", [state]);

  const startRecording = async () => {
    setError(null);
    try {
      if (Platform.OS === "web") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaChunksRef.current = [];
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) mediaChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          console.log("[Voice] Web recorder stopped");
        };
        mediaRecorder.start();
        setState("recording");
        return;
      }

      if (!Audio) throw new Error("Audio module not available");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      nativeRecordingRef.current = recording;
      setState("recording");
    } catch (e) {
      console.error("[Voice] startRecording error", e);
      setError("Microphone unavailable. Please grant permission and try again.");
      setState("error");
    }
  };

  const stopRecording = async () => {
    try {
      setState("processing");
      if (Platform.OS === "web") {
        const mr = mediaRecorderRef.current;
        if (!mr) throw new Error("No active recording");
        mr.stop();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", file);
        const stt = await transcribeAudio(formData);
        onTranscript(stt.text);
        setState("idle");
        return;
      }

      if (!Audio) throw new Error("Audio module not available");
      const recording = nativeRecordingRef.current;
      if (!recording) throw new Error("No active recording");
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (!uri) throw new Error("Recording URI unavailable");

      const uriParts = uri.split(".");
      const fileType = uriParts[uriParts.length - 1] ?? "m4a";
      const audioFile: { uri: string; name: string; type: string } = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      };

      const formData = new FormData();
      // @ts-expect-error React Native FormData supports objects with uri/name/type
      formData.append("audio", audioFile);

      const stt = await transcribeAudio(formData);
      onTranscript(stt.text);
      setState("idle");
      nativeRecordingRef.current = null;
    } catch (e) {
      console.error("[Voice] stopRecording error", e);
      setError("Could not process audio. Please try again.");
      setState("error");
    }
  };

  return (
    <View style={styles.container} testID="voice-recorder">
      <Text style={styles.title}>Voice pay</Text>
      <Text style={styles.caption}>Speak naturally: &quot;Send 12 TRX to Alex for groceries&quot;</Text>
      <View style={styles.controls}>
        {!isRecording ? (
          <HSButton title="Start recording" onPress={startRecording} variant="primary" testID="start-recording" />
        ) : (
          <HSButton title="Stop & transcribe" onPress={stopRecording} variant="secondary" testID="stop-recording" />
        )}
      </View>
      {isProcessing ? <Text style={styles.processing}>Transcribing your foodie request…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 18, fontWeight: "800" as const, color: Colors.brand.ink },
  caption: { fontSize: 14, color: Colors.brand.inkMuted },
  controls: { flexDirection: "row", gap: 12 },
  processing: { color: Colors.brand.red, fontWeight: "700" as const },
  error: { color: Colors.brand.red, fontWeight: "700" as const },
});

export default React.memo(VoiceRecorder);
