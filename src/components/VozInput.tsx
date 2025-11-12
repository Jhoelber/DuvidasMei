import React, { useState } from "react";

interface VozInputProps {
  onResult: (text: string) => void;
}

export const VozInput: React.FC<VozInputProps> = ({ onResult }) => {
  const [ouvindo, setOuvindo] = useState(false);
  const [texto, setTexto] = useState("");

  const iniciar = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;

    recognition.onstart = () => setOuvindo(true);
    recognition.onend = () => setOuvindo(false);
    recognition.onresult = (event: any) => {
      const resultado = event.results[0][0].transcript;
      setTexto(resultado);
      onResult(resultado);
    };

    recognition.start();
  };

  return (
    <div className="text-center">
      <p className="mb-2 text-gray-700">Clique em falar para tirar sua dúvida</p>
      <button
        onClick={iniciar}
        className={`px-6 py-3 rounded-lg text-white ${
          ouvindo ? "bg-red-500" : "bg-blue-600"
        }`}
      >
        {ouvindo ? "Ouvindo..." : "Falar"}
      </button>
      {texto && <p className="mt-3 text-sm italic text-gray-600">"{texto}"</p>}
    </div>
  );
};
