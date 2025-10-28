import React, { useState } from "react";
import { VozInput } from "./VozInput";

// ===== REST Gemini v1 (gemini-2.0-flash) =====
async function gerarComGeminiREST(apiKey: string, prompt: string): Promise<string> {
    if (!apiKey) throw new Error("API key ausente. Defina VITE_GEMINI_API_KEY no .env");

    const url =
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" +
        encodeURIComponent(apiKey);

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini v1 error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ===== Fala =====
function speak(text: string) {
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "pt-BR";
        window.speechSynthesis.speak(u);
    } catch { }
}

function stopSpeak() {
    try {
        window.speechSynthesis.cancel();
    } catch { }
}

export const AnaliseSWOT: React.FC = () => {
    const [resultado, setResultado] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const gerarAnalise = async (textoUsuario: string) => {
        setCarregando(true);
        setErro(null);

        const promptSystem = `📌 System Message para Agente IA – Especialista em Negócios e Marketing e nao utilize markdown
🧠 Cargo Você é um especialista em negócios, marketing e planejamento simplificado. Seu papel é ajudar o usuário a entender como vender um produto ou serviço, mesmo que ele não tenha conhecimento prévio sobre o assunto. 🌍 Contexto Usuários iniciantes informarão apenas o produto ou serviço que desejam vender. Com base nessa informação, você deve gerar um plano de negócios simplificado e didático, com linguagem clara e acessível, como se estivesse explicando para alguém que nunca estudou administração ou marketing. 📏 Regras Sempre utilize linguagem simples, sem jargões técnicos ou termos difíceis. O conteúdo deve ser explicativo e objetivo, com exemplos práticos e comparações quando possível. Siga sempre a estrutura de resposta padronizada (detalhada em “Procedimentos”). Nunca invente o que o produto “poderia ser” — baseie-se exclusivamente na descrição do usuário. Fale com tom amigável, profissional e encorajador, como um mentor. 🚫 Restrições Não utilize termos técnicos sem explicação. Não gere dados fictícios como preços, lucros ou números de mercado, a menos que o usuário solicite. Não adicione etapas avançadas como plano financeiro, jurídico ou contábil (a menos que pedido). Não use linguagem negativa ou desmotivadora. ✅ Comportamentos esperados Seja inspirador, prático e didático. Incentive o usuário a dar os primeiros passos. Use comparações com situações cotidianas para facilitar a compreensão. Quando possível, mencione canais de venda acessíveis, como WhatsApp, Instagram, Mercado Livre, feiras locais, etc. 🔁 Procedimentos Ao receber o nome de um produto ou serviço, siga esta ordem na sua resposta: Descrição do produto ou serviço Explique de forma simples o que é, como funciona, onde geralmente é vendido ou usado. Público-alvo provável Faixa etária Gênero predominante (se aplicável) Classe social Hábitos ou interesses Locais/canais onde costumam comprar Proposta de valor O que diferencia esse produto/serviço dos concorrentes. O que o torna especial? Análise SWOT (FORÇAS, FRAQUEZAS, OPORTUNIDADES e AMEAÇAS) Use tópicos claros com uma pequena explicação. Próximos passos recomendados Sugira de 3 a 5 ações simples e práticas para o usuário começar a vender. Por exemplo: Crie uma conta no Instagram Tire boas fotos Converse com amigos para validar o produto Ofereça amostras ou descontos iniciais Participe de feiras ou eventos locais 💡 Exemplo de saída esperada (usuário informa: “Velas aromáticas”) 🕯️ Descrição: Velas aromáticas são produtos feitos com cera, pavio e essências perfumadas. São usadas para criar um ambiente agradável e relaxante, sendo comuns em casas, spas, escritórios ou como presentes. 🎯 Público-alvo provável: Idade: 25 a 45 anos Gênero predominante: feminino Classe social: média a alta Hábitos/interesses: bem-estar, decoração, produtos artesanais, presentes criativos Locais de compra: Instagram, Shopee, feiras de artesanato, lojas de decoração ✨ Proposta de valor: Produto artesanal, personalizável, com fragrâncias únicas. Pode se destacar por design, embalagens recicláveis ou produção sustentável. 📊 Análise SWOT: Forças: Produto bonito e funcional, ótimo para presentes, margem de lucro razoável. Fraquezas: Concorrência artesanal é grande, difícil fidelizar se o aroma não for marcante. Oportunidades: Pode vender kits para datas comemorativas (Natal, Dia das Mães). Ameaças: Grandes lojas vendem velas baratas e em larga escala. 🚀 Próximos passos recomendados: Escolha 2 ou 3 aromas e faça protótipos Tire boas fotos e publique no Instagram com preço e contato Teste vendas entre amigos ou em grupos de WhatsApp Ofereça um kit promocional Cadastre-se em feiras locais ou venda em parceria com salões e lojas de bairro
`;

        const prompt = `${promptSystem}\n\nEntrada do usuário (produto/serviço): ${textoUsuario}`;

        try {
            const resposta = await gerarComGeminiREST(
                import.meta.env.VITE_GEMINI_API_KEY as string,
                prompt
            );
            setResultado(resposta || "Não houve texto na resposta do modelo.");
        } catch (e: any) {
            console.error(e);
            setErro(e?.message || "Falha ao gerar análise.");
            setResultado("");
        } finally {
            setCarregando(false);
        }
    };

    return (
        // Troque o wrapper principal por este:
        <div className="h-screen w-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col">

            {/* Header fixo */}
            <header className="shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-backdrop-filter:backdrop-blur">
                <div className="px-8 py-5">
                    <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Análise SWOT por Voz
                    </h1>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        Fale o produto/serviço, gere a análise e escute quando quiser.
                    </p>
                </div>
            </header>

            {/* Main ocupa todo o restante da viewport */}
            <main className="flex-1 overflow-auto px-8 py-8">
                {/* grid fluida, sem max-width */}
                <section className="grid gap-8 xl:gap-10 grid-cols-1 lg:grid-cols-2 h-full">

                    {/* Card de entrada ocupa a altura disponível */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                        <div className="p-8">
                            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Entrada por voz</h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                Clique e diga o que deseja analisar (ex.: “bolos caseiros”, “aulas de violão”).
                            </p>

                            <div className="mt-6">
                                <VozInput onResult={gerarAnalise} />
                            </div>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <button
                                    onClick={() => resultado && speak(resultado)}
                                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    disabled={!resultado || carregando}
                                    title={resultado ? "Ler o resultado" : "Gere uma análise primeiro"}
                                >
                                    Escutar
                                </button>

                                <button
                                    onClick={stopSpeak}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 px-5 py-2.5 text-sm font-medium hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                    disabled={carregando}
                                >
                                    Parar áudio
                                </button>
                            </div>

                            {carregando && (
                                <div className="mt-6 flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
                                    <span className="text-sm">Gerando análise…</span>
                                </div>
                            )}

                            {erro && (
                                <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                                    {erro}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card de resultado */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col overflow-hidden">
                        {/* Cabeçalho do card */}
                        <div className="p-8 pb-4 shrink-0">
                            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Resultado</h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                O conteúdo gerado aparece abaixo. Você pode copiar ou limpar.
                            </p>
                        </div>

                        {/* Área rolável */}
                        <div className="px-8 flex-1 min-h-0 overflow-auto">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-5">
                                {resultado ? (
                                    <pre className="whitespace-pre-wrap wrap-break-word text-[1rem] leading-7 text-slate-800 dark:text-slate-200">
                                        {resultado}
                                    </pre>
                                ) : (
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Aguardando sua entrada de voz…</div>
                                )}
                            </div>

                            {/* Botões fixos no fundo da área rolável */}
                            <div className="sticky bottom-0 -mx-8 mt-4 border-t border-slate-200 dark:border-slate-800 
                    bg-white/90 dark:bg-slate-900/90 backdrop-blur px-8 py-4">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(resultado || "")}
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                        disabled={!resultado}
                                    >
                                        Copiar texto
                                    </button>
                                    <button
                                        onClick={() => setResultado("")}
                                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-100 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                        disabled={!resultado}
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>



                </section>
            </main>

            {/* Footer enxuto */}
            <footer className="shrink-0 border-t border-slate-200 dark:border-slate-800">
                <div className="px-8 py-5 text-xs text-slate-500 dark:text-slate-400">
                    Análise gerada por IA. Revise e adapte ao seu contexto.
                </div>
            </footer>
        </div>

    );
};
