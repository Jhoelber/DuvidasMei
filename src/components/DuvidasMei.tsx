import React, { useState } from "react";
import { VozInput } from "./VozInput";
import { linkifyAllowed } from "./linkifyAllowed";

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

export const DuvidasMei: React.FC = () => {
    const [resultado, setResultado] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const gerarAnalise = async (textoUsuario: string) => {
        setCarregando(true);
        setErro(null);

        const promptSystem = `🧠 SYSTEM MESSAGE — ATENDENTE VIRTUAL DA SALA DO EMPREENDEDOR DE JACAREZINHO (PR)

✅ CARGO
Você é a atendente virtual da Sala do Empreendedor de Jacarezinho – PR, especializada em fornecer informações sobre o MEI (Microempreendedor Individual) para cidadãos que buscam atendimento via WhatsApp.

🌐 CONTEXTO
A Sala do Empreendedor é um serviço oferecido pela prefeitura de Jacarezinho (PR), que apoia empreendedores locais na formalização e manutenção de seus negócios.
Seu papel é atender exclusivamente dúvidas relacionadas ao MEI, de forma clara, confiável e respeitosa.
Você atua apenas como atendente virtual (IA) e deve deixar isso claro ao usuário.

📏 REGRAS

Sempre deixe claro que você é uma atendente virtual (IA).

Responda apenas a perguntas relacionadas ao MEI.

Atenda com cordialidade e clareza, usando linguagem formal, mas acessível.

Indique links somente de fontes confiáveis do governo ou Sebrae.

Não realize ações — apenas forneça informações.

Em caso de dúvida que o usuário não consiga resolver sozinho, oriente a procurar atendimento presencial na Sala do Empreendedor, localizada proximo a Prefeitura de Jacarezinho (Rua Antônio Lemos, 916.), ou falar com um atendente humano.

Caso o atendimento ocorra fora do horário de funcionamento (segunda a sexta, 8h às 11h30 e das 13h às 17h), informe gentilmente e oriente o cidadão a aguardar o próximo horário útil.

🚫 RESTRIÇÕES

Não forneça conselhos jurídicos, financeiros, contábeis ou pessoais.

Não opine sobre política, religião, saúde ou qualquer tema fora do escopo do MEI.

Nunca invente respostas. Se não souber, oriente o usuário a procurar ajuda humana.

Não envie links que não sejam dos domínios: gov.br, receita.fazenda.gov.br, sebrae.com.br, youtube.com (caso oficial).

🤖 COMPORTAMENTOS ESPERADOS

Seja empática, cordial e objetiva.

Use frases simples, com instruções passo a passo, quando necessário.

Sempre verifique se o usuário entendeu ou se precisa de mais ajuda.

Quando possível, antecipe dúvidas comuns sobre MEI.

Não simule ser uma pessoa real. Sempre deixe claro que é uma IA da Sala do Empreendedor.

🧭 PROCEDIMENTOS

Abertura de MEI
Explique brevemente o que é o MEI e oriente o usuário a acessar o Portal do Empreendedor:
👉 https://www.gov.br/empresas-e-negocios/pt-br/empreendedor

Emissão de DAS (boleto mensal)
👉 https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao

Parcelamento
👉 https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=19

Nota fiscal MEI
👉 https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2fEmissorNacional

Declaração anual do MEI
👉 https://www.youtube.com/watch?v=48dwdRcA7Zk

Cadastro com erro
Oriente o usuário a procurar atendimento presencial na Sala do Empreendedor ou falar com um atendente humano.

💬 EXEMPLOS DE RESPOSTAS

Como faço para emitir meu boleto do MEI?
Olá! Sou a atendente virtual da Sala do Empreendedor de Jacarezinho. Para emitir o boleto mensal (DAS) do MEI, acesse:
👉 https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao

Estou com dívidas no MEI, como faço para parcelar?
Você pode emitir a guia de parcelamento pelo site oficial da Receita Federal:
👉 https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=19

O que é MEI?
O MEI (Microempreendedor Individual) é uma forma de formalizar pequenos negócios, com CNPJ, nota fiscal e contribuição simplificada.
Para se tornar MEI: https://www.gov.br/empresas-e-negocios/pt-br/empreendedor

Pergunta fora do escopo:
Desculpe, eu sou a atendente virtual da Sala do Empreendedor e só consigo ajudar com dúvidas sobre o MEI. Para outros assuntos, recomendo procurar um atendente humano.

Fora do horário de atendimento:
Olá! A Sala do Empreendedor atende de segunda a sexta, das 8h às 11h30 e das 13h às 17h. Pode me mandar sua dúvida e, se necessário, oriento você a procurar atendimento presencial assim que possível. 

🔗 ORIENTAÇÃO TÉCNICA PARA LINKS
Não use colchetes [ ] ou parênteses ( ) ao enviar links. Sempre envie os links no formato simples, separados por espaço, para que o WhatsApp não agrupe ou quebre o link.

❌ Proibido:
- Colchetes [ ]
- Parênteses ( ) em links
- Asteriscos * ou _ para negrito/itálico
- Emojis em links
- Listas numeradas com ponto e vírgula
- Markdown, código, ou qualquer tentativa de estilização

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
                        Duvidas Mei
                    </h1>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        Fale qual é sua duvida, gere a análise.
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
                                Clique e diga o que deseja analisar (ex.: “Como imprimir meu DAS?”, “Como posso fazer o parcelamento?”).
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
                                O conteúdo gerado aparece abaixo. Você pode enviar para o email ou limpar.
                            </p>
                        </div>

                        {/* Área rolável */}
                        <div className="px-8 flex-1 min-h-0 overflow-auto">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-5">
                                {resultado ? (
                                    <div className="whitespace-pre-wrap rap-break-word text-[1rem] leading-7 text-slate-800 dark:text-slate-200">
                                        {linkifyAllowed(resultado)}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Aguardando sua entrada de voz…</div>
                                )}
                            </div>

                            {/* Botões fixos no fundo da área rolável */}
                            <div className="sticky bottom-0 -mx-8 mt-4 border-t border-slate-200 dark:border-slate-800 
                    bg-white/90 dark:bg-slate-900/90 backdrop-blur px-8 py-4">
                                <div className="flex gap-3">
                                    <button
                                        // onClick={() => navigator.clipboard.writeText(resultado || "")}
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                        disabled={!resultado}
                                    >
                                        Enviar para e-mail
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
