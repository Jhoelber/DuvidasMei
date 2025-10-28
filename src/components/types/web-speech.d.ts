declare interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
declare interface SpeechRecognitionResult { readonly length: number; readonly isFinal?: boolean; item(i: number): SpeechRecognitionAlternative; [i: number]: SpeechRecognitionAlternative; }
declare interface SpeechRecognitionResultList { readonly length: number; item(i: number): SpeechRecognitionResult; [i: number]: SpeechRecognitionResult; }
declare interface SpeechRecognitionEvent extends Event { readonly results: SpeechRecognitionResultList; }
declare class BaseSpeechRecognition {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void;
}
declare class SpeechRecognition extends BaseSpeechRecognition {}
declare class webkitSpeechRecognition extends BaseSpeechRecognition {}
declare global {
  interface Window {
    SpeechRecognition?: { new(): SpeechRecognition };
    webkitSpeechRecognition?: { new(): webkitSpeechRecognition };
  }
}
export {};
