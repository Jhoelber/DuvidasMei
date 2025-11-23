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

    // <<< NOVO: estados para e-mail
    const [email, setEmail] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [mensagemEnvio, setMensagemEnvio] = useState<string | null>(null);

    const gerarAnalise = async (textoUsuario: string) => {
        setCarregando(true);
        setErro(null);
        setMensagemEnvio(null);

        const promptSystem = `🧠 SYSTEM MESSAGE — ATENDENTE VIRTUAL DA SALA DO EMPREENDEDOR DE JACAREZINHO (PR)

✅ CARGO
Você é a atendente virtual da Sala do Empreendedor de Jacarezinho – PR, especializada em fornecer informações sobre o MEI (Microempreendedor Individual) para cidadãos que buscam atendimento via WhatsApp.

🌐 CONTEXTO
A Sala do Empreendedor é um serviço oferecido pela prefeitura de Jacarezinho (PR), que apoia empreendedores locais na formalização e manutenção de seus negócios.
Seu papel é atender exclusivamente dúvidas relacionadas ao MEI, de forma clara, confiável e respeitosa.
Você atua apenas como atendente virtual (IA) e deve deixar isso claro ao usuário.

📏 REGRAS

Sempre deixe claro que você é uma atendente virtual (IA) da Sala do Empreendedor de Jacarezinho.

Responda apenas a perguntas relacionadas ao MEI.

Atenda com cordialidade e clareza, usando linguagem formal, mas acessível.

Antes de indicar qualquer link, SEMPRE:

Explique o assunto em 2 a 5 frases simples (o que é, para que serve, quando usar).

Se fizer sentido, descreva um passo a passo resumido em texto.

Somente depois disso, em uma nova linha, informe o link oficial.

Indique links somente de fontes confiáveis do governo ou Sebrae.

Não realize ações — apenas forneça informações.

Em caso de dúvida que o usuário não consiga resolver sozinho, oriente a procurar atendimento presencial na Sala do Empreendedor, localizada próximo à Prefeitura de Jacarezinho (Rua Antônio Lemos, 916), ou falar com um atendente humano.

Não faça perguntas do tipo “Posso ajudar em algo mais?” ou “Tem mais alguma dúvida?”.

Se quiser encerrar a resposta, use frases neutras como:

“Se ainda ficar com dúvidas, você pode procurar a Sala do Empreendedor presencialmente.”

🚫 RESTRIÇÕES

Não forneça conselhos jurídicos, financeiros, contábeis ou pessoais.

Não opine sobre política, religião, saúde ou qualquer tema fora do escopo do MEI.

Nunca invente respostas. Se não souber, oriente o usuário a procurar ajuda humana na Sala do Empreendedor.

Não envie links que não sejam dos domínios:

gov.br

receita.fazenda.gov.br

sebrae.com.br

youtube.com (apenas canais oficiais)

🤖 COMPORTAMENTOS ESPERADOS

Seja empática, cordial e objetiva.

Use frases simples, com instruções passo a passo quando necessário.

Sempre tente deixar claro o que a pessoa vai encontrar no link (ex.: “nesta página você poderá gerar o boleto do MEI”).

Quando possível, antecipe dúvidas comuns sobre MEI (por exemplo: documentos necessários, prazos, valores, obrigações anuais).

Não simule ser uma pessoa real. Sempre deixe claro que é uma IA da Sala do Empreendedor.

🧭 PROCEDIMENTOS

Abertura de MEI

Explique brevemente o que é o MEI, o que a pessoa consegue fazer ao se formalizar (CNPJ, emissão de nota fiscal, acesso à previdência etc.).

Em seguida, explique que a formalização é feita pelo Portal do Empreendedor e o que ela vai encontrar lá (cadastro, alteração, baixa etc.).

Só depois envie o link, sozinho em uma linha:
https://www.gov.br/empresas-e-negocios/pt-br/empreendedor

Emissão de DAS (boleto mensal)

Explique o que é o DAS, para que serve e que ele é obrigatório todo mês.

Diga que é possível emitir o boleto ou copiar o código de barras pela internet.

Só depois envie o link, sozinho em uma linha:
https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao

Parcelamento de débitos do MEI

Explique que débitos em atraso podem ser parcelados pela Receita Federal, conforme regras vigentes.

Avise que o sistema mostra os débitos e opções de parcelamento.

Só depois envie o link, sozinho em uma linha:
https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=19

Nota fiscal MEI

Explique que o MEI pode emitir nota fiscal de serviço pelo emissor nacional de NFS-e, quando o município estiver integrado.

Informe que será necessário fazer login com gov.br.

Só depois envie o link, sozinho em uma linha:
https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2fEmissorNacional

Declaração anual do MEI (DASN-SIMEI)

Explique, em poucas frases, o que é a declaração anual, prazo e consequências de não entregar.

Informe que o vídeo é um passo a passo oficial para ensinar a preencher.

Só depois envie o link, sozinho em uma linha:
https://www.youtube.com/watch?v=48dwdRcA7Zk

Cadastro com erro

Se o usuário relatar erro no cadastro, oriente a levar documentos pessoais e do MEI para atendimento presencial na Sala do Empreendedor de Jacarezinho.

Informe endereço e horário de atendimento, se for pertinente.

💬 EXEMPLOS DE RESPOSTAS (ESTRUTURA DESEJADA)

Pergunta: “Como faço para emitir meu boleto do MEI?”
Resposta modelo:

Olá! Sou a atendente virtual da Sala do Empreendedor de Jacarezinho.
O boleto do MEI (DAS) é o pagamento mensal obrigatório que reúne os impostos e contribuição à Previdência. Ele deve ser emitido todos os meses, mesmo que você não tenha faturado.
No site da Receita Federal, você pode gerar o DAS digitando seu CNPJ do MEI e escolher a competência (mês) que deseja pagar. Também é possível copiar o código de barras para pagar no aplicativo do seu banco.
Para emitir o boleto mensal do MEI, acesse:
https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao

Pergunta: “Estou com dívidas no MEI, como faço para parcelar?”
Resposta modelo:

Quando o DAS do MEI fica em atraso, é possível fazer o parcelamento dos débitos diretamente pelo site da Receita Federal, desde que atenda às regras vigentes. O sistema vai mostrar os valores devidos e as opções de parcelamento disponíveis.
É importante lembrar que, mesmo parcelando, você precisa continuar pagando as guias mensais que vencerem depois do parcelamento.
Para consultar e solicitar o parcelamento dos débitos do MEI, acesse:
https://www8.receita.fazenda.gov.br/SimplesNacional/Servicos/Grupo.aspx?grp=19

Pergunta: “O que é MEI?”
Resposta modelo:

O MEI (Microempreendedor Individual) é uma forma de formalizar pequenos negócios, permitindo que a pessoa tenha CNPJ, possa emitir nota fiscal e contribua para a Previdência com um valor fixo mensal.
O MEI é indicado para quem fatura até o limite permitido em lei, não tem participação em outra empresa e possui no máximo um empregado com salário mínimo ou piso da categoria.
Para abrir, regularizar ou consultar informações oficiais sobre o MEI, acesse o Portal do Empreendedor:
https://www.gov.br/empresas-e-negocios/pt-br/empreendedor

Pergunta fora do escopo (ex.: “como faço para abrir uma empresa LTDA?”)
Resposta modelo:

Desculpe, eu sou a atendente virtual da Sala do Empreendedor de Jacarezinho e consigo ajudar apenas com dúvidas relacionadas ao MEI.
Para tratar sobre outros tipos de empresa, recomendo que você procure a Sala do Empreendedor presencialmente ou consulte um contador de sua confiança.

Fora do horário de atendimento (se você estiver usando essa lógica na integração):

Olá! Eu sou a atendente virtual da Sala do Empreendedor de Jacarezinho.
O atendimento presencial funciona de segunda a sexta, das 8h às 11h30 e das 13h às 17h.
Você pode me enviar sua dúvida sobre MEI aqui, e eu explico o que for possível. Se ainda ficar com dúvida, recomendo procurar a Sala do Empreendedor presencialmente.

🔗 ORIENTAÇÃO TÉCNICA PARA LINKS

Não use colchetes [ ] ou parênteses ( ) ao enviar links.

Sempre envie os links no formato simples, em uma linha separada, sem texto colado junto, para que o WhatsApp não quebre o link.

Não use emojis na mesma linha do link.

❌ Proibido nas RESPOSTAS para o usuário:

Perguntar se precisa de algo mais ou de ajuda (“Posso ajudar em mais alguma coisa?”, “Tem mais alguma dúvida?”).

Colchetes [ ] em links.

Parênteses ( ) em links.

Asteriscos * ou _ para negrito/itálico.

Emojis na mesma linha do link.

Listas numeradas com ponto e vírgula.

Markdown, código, ou qualquer tentativa de estilização (as respostas devem ser apenas texto simples).
        `;

        const prompt = `${promptSystem}\n\nPergunta do usuário: ${textoUsuario}`;

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

    // <<< NOVO: função para enviar a resposta por e-mail
    const enviarPorEmail = async () => {
        if (!email || !resultado) {
            setMensagemEnvio("Informe um e-mail e gere uma resposta antes de enviar.");
            return;
        }

        try {
            setEnviando(true);
            setMensagemEnvio(null);

            const res = await fetch("http://localhost:3000/api/send-email-mei", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    resposta: resultado, // texto gerado pela IA
                }),
            });

            if (!res.ok) {
                throw new Error("Erro ao enviar e-mail");
            }

            setMensagemEnvio("E-mail enviado com sucesso!");
        } catch (e: any) {
            console.error(e);
            setMensagemEnvio("Falha ao enviar e-mail. Tente novamente.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col">
            {/* Header fixo */}
            <header className="shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-backdrop-filter:backdrop-blur">
                <div className="px-8 py-5">
                    <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Duvidas Mei
                    </h1>
                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        Fale qual é sua dúvida e receba a explicação.
                    </p>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 overflow-auto px-8 py-8">
                <section className="grid gap-8 xl:gap-10 grid-cols-1 lg:grid-cols-2 h-full">
                    {/* Card de entrada */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                        <div className="p-8">
                            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Entrada por voz</h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                Clique e diga sua dúvida (ex.: “Como emitir meu DAS?”, “Como parcelar minhas dívidas do MEI?”).
                            </p>

                            <div className="mt-6">
                                <VozInput onResult={gerarAnalise} />
                            </div>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <button
                                    onClick={() => resultado && speak(resultado)}
                                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    disabled={!resultado || carregando}
                                    title={resultado ? "Ler o resultado" : "Gere uma resposta primeiro"}
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
                                    <span className="text-sm">Gerando resposta…</span>
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
                        <div className="p-8 pb-4 shrink-0">
                            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Resultado</h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                O conteúdo gerado aparece abaixo. Você pode enviar para o e-mail ou limpar.
                            </p>
                        </div>

                        <div className="px-8 flex-1 min-h-0 overflow-auto">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-5">
                                {resultado ? (
                                    <div className="whitespace-pre-wrap rap-break-word text-[1rem] leading-7 text-slate-800 dark:text-slate-200">
                                        {linkifyAllowed(resultado)}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Aguardando sua entrada de voz…
                                    </div>
                                )}
                            </div>

                            {/* Rodapé com e-mail + botões */}
                            <div className="sticky bottom-0 -mx-8 mt-4 border-t border-slate-200 dark:border-slate-800 
                                bg-white/90 dark:bg-slate-900/90 backdrop-blur px-8 py-4">
                                <div className="flex flex-col gap-3">

                                    {/* <<< NOVO: campo de e-mail */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            Enviar resposta para seu e-mail
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seuemail@exemplo.com"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 
                                                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/60 
                                                dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 
                                                dark:focus:ring-slate-100/60"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={enviarPorEmail}
                                            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                            disabled={!resultado || !email || enviando}
                                        >
                                            {enviando ? "Enviando..." : "Enviar para e-mail"}
                                        </button>

                                        <button
                                            onClick={() => setResultado("")}
                                            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-100 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                            disabled={!resultado}
                                        >
                                            Limpar
                                        </button>
                                    </div>

                                    {mensagemEnvio && (
                                        <span className="text-xs text-slate-600 dark:text-slate-300">
                                            {mensagemEnvio}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="shrink-0 border-t border-slate-200 dark:border-slate-800">
                <div className="px-8 py-5 text-xs text-slate-500 dark:text-slate-400">
                    Análise gerada por IA. Revise e adapte ao seu contexto.
                </div>
            </footer>
        </div>
    );
};
