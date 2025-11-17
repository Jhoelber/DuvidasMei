import React, { useRef, useState } from "react";

interface VozInputProps {
  onResult: (text: string) => void;
}

export const VozInput: React.FC<VozInputProps> = ({ onResult }) => {
  const [ouvindo, setOuvindo] = useState(false);
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Detecta se estamos no Electron (bridge do preload)
  const temBridgeElectron = (() => {
    if (typeof window === "undefined") return false;

    const anyWin = window as any;
    const tem =
      !!anyWin.totemVoz &&
      typeof anyWin.totemVoz.transcrever === "function";

    console.log("[VozInput] detecção bridge", {
      temBridgeElectron: tem,
      hasTotemVoz: !!anyWin.totemVoz,
      userAgent: navigator.userAgent,
    });

    return tem;
  })();

  // ---- CAMINHO 1: rodando em navegador normal (sem Electron) → Web Speech API
  const iniciarBrowserWebSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus(
        "Seu navegador não suporta reconhecimento de voz. Use o Totem ou um navegador compatível (Chrome/Edge)."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setOuvindo(true);
      setStatus("Ouvindo…");
    };

    recognition.onend = () => {
      setOuvindo(false);
      // se deu erro, a mensagem já foi ajustada em onerror
      if (status === "Ouvindo…") {
        setStatus(null);
      }
    };

    recognition.onresult = (event: any) => {
      const resultado = event.results[0][0].transcript;
      setTexto(resultado);
      onResult(resultado);
      setStatus(null);
    };

    recognition.onerror = (e: any) => {
      console.error("Erro no SpeechRecognition:", e);
      if (e.error === "network") {
        setStatus(
          "Erro de rede no serviço de voz do navegador. Tente novamente ou use o Totem."
        );
      } else {
        setStatus("Erro no reconhecimento de voz do navegador.");
      }
      setOuvindo(false);
    };

    recognition.start();
  };

  // ---- CAMINHO 2: rodando dentro do Electron → grava áudio e manda pro main
  const iniciarElectronSTT = async () => {
    try {
      setStatus("Autorizando microfone…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstart = () => {
        setOuvindo(true);
        setStatus("Gravando… fale agora.");
      };

      mediaRecorder.onstop = async () => {
        setOuvindo(false);
        setStatus("Processando áudio…");

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // transforma o áudio em base64
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        try {
          const textoReconhecido = await (window as any).totemVoz.transcrever(
            base64
          );

          if (textoReconhecido && typeof textoReconhecido === "string") {
            setTexto(textoReconhecido);
            onResult(textoReconhecido);
            setStatus(null);
          } else {
            setStatus("Não consegui entender o áudio, tente novamente.");
          }
        } catch (err) {
          console.error(err);
          setStatus("Erro ao transcrever o áudio no totem.");
        } finally {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();

      // grava ~5s
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 5000);
    } catch (err) {
      console.error(err);
      setStatus("Não foi possível acessar o microfone no totem.");
      setOuvindo(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  };

  const iniciar = () => {
    console.log("[VozInput] clique no botão", {
      ouvindo,
      temBridgeElectron,
    });

    // já está gravando → parar (no Electron)
    if (ouvindo) {
      if (temBridgeElectron && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (temBridgeElectron) {
      // dentro do Electron
      iniciarElectronSTT();
    } else {
      // navegador normal
      iniciarBrowserWebSpeech();
    }
  };

  return (
    <div className="text-center">
      <p className="mb-2 text-gray-700">Fale o nome do produto ou serviço:</p>

      <button
        onClick={iniciar}
        className={`px-6 py-3 rounded-lg text-white ${
          ouvindo ? "bg-red-500" : "bg-blue-600"
        }`}
      >
        {ouvindo ? "Gravando..." : "🎙️ Falar"}
      </button>

      {status && (
        <p className="mt-2 text-xs text-gray-500">
          {status}
        </p>
      )}

      {texto && (
        <p className="mt-3 text-sm italic text-gray-600">"{texto}"</p>
      )}
    </div>
  );
};
