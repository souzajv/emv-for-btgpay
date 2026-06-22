import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dirname, "..", "content", "chunks");
const QUIZZES_DIR = join(__dirname, "..", "content", "quizzes");

const QUESTION_BANK = {
  junior: [
    { prompt: "O que significa a sigla EMV?", options: ["Europay, Mastercard e Visa", "Electronic Mobile Verification", "Encrypted Merchant Value", "European Money Virtual"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "o-que-e-emv", explanation: "EMV é o padrão criado por Europay, Mastercard e Visa para pagamentos com chip." },
    { prompt: "Qual a principal vantagem do chip sobre a tarja magnética?", options: ["Cryptograma dinâmico por transação", "Cartão mais barato", "Não precisa de rede", "Funciona sem eletricidade"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "chip-vs-tarja" },
    { prompt: "Card Present (CP) significa que:", options: ["O cartão está fisicamente no ponto de venda", "O pagamento é sempre online", "Não usa EMV", "É apenas e-commerce"], correct: 0, chunk: "fundamentos-cnp-cp", anchor: "definicao-cp" },
    { prompt: "CNP é usado principalmente em:", options: ["E-commerce e pedidos remotos", "Tap no terminal", "Chip contactless", "PIN no teclado do POS"], correct: 0, chunk: "fundamentos-cnp-cp", anchor: "definicao-cnp" },
    { prompt: "Level 1 da certificação EMV testa:", options: ["Interface física e protocolo NFC/contato", "Apenas o app Flutter", "Somente o backend", "Marketing do produto"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-1-fisico" },
    { prompt: "Level 2 certifica:", options: ["O kernel de aplicação EMV", "A cor do app", "O logo da bandeira", "A velocidade da internet"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-2-kernel" },
    { prompt: "Tap to Mobile transforma:", options: ["Smartphone certificado em terminal de pagamento", "Cartão em dinheiro", "POS em impressora", "Tablet em scanner de código de barras"], correct: 0, chunk: "contactless-tap-mobile", anchor: "tap-to-mobile" },
    { prompt: "Contactless usa principalmente:", options: ["NFC", "Bluetooth clássico", "USB", "Infravermelho"], correct: 0, chunk: "contactless-tap-mobile", anchor: "contactless-overview" },
    { prompt: "CDCVM verifica o portador via:", options: ["Biometria ou PIN do dispositivo", "Assinatura em papel", "SMS ao banco", "E-mail"], correct: 0, chunk: "contactless-tap-mobile", anchor: "cdcvm" },
    { prompt: "O app Flutter no BtgPay fica na camada de:", options: ["Apresentação", "Kernel EMV", "Switch da bandeira", "Emissor do cartão"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "camadas-app" },
    { prompt: "Dados sensíveis como PIN devem ser processados:", options: ["No ambiente seguro do SDK/kernel", "No SharedPreferences do Flutter", "Em logs do console", "No widget TextField comum"], correct: 0, chunk: "seguranca-terminal", anchor: "ambiente-seguro" },
    { prompt: "PAN em claro não deve aparecer:", options: ["Em logs do aplicativo", "Na tela mascarada", "No comprovante tokenizado", "Em relatórios agregados"], correct: 0, chunk: "seguranca-terminal", anchor: "pci-escopo" },
    { prompt: "AID refere-se a:", options: ["Identificador da aplicação no cartão", "Código do comerciante", "Taxa de juros", "Número do terminal"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "fluxo-transacao-chip" },
    { prompt: "Level 3 testa integração com:", options: ["Rede do adquirente", "Rede social", "GPS do aparelho", "Câmera frontal"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-3-integracao" },
    { prompt: "Root/jailbreak no dispositivo:", options: ["Deve bloquear transações de pagamento", "Acelera o NFC", "É recomendado", "Não afeta SoftPOS"], correct: 0, chunk: "tap-to-mobile-guidelines", anchor: "requisitos-dispositivo" },
    { prompt: "Liability shift em CP EMV tende a:", options: ["Transferir responsabilidade ao emissor se terminal certificado", "Eliminar toda fraude", "Culpar sempre o lojista", "Ignorar certificação"], correct: 0, chunk: "fundamentos-cnp-cp", anchor: "liability-shift" },
    { prompt: "Estado 'awaitingCard' significa:", options: ["Aguardando aproximação/inserção do cartão", "Venda finalizada", "Impressão de nota fiscal", "Sincronização de estoque"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "estados-transacao" },
    { prompt: "ARQC é gerado:", options: ["Pelo chip durante a transação EMV", "Pelo usuário digitando", "Pelo GPS", "Pela câmera"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "chip-vs-tarja" },
    { prompt: "Certificação EMV é feita em:", options: ["Laboratórios aprovados", "Qualquer escritório", "Apenas no cliente", "Sem testes"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "labs-aprovados" },
    { prompt: "Timeout contactless deve:", options: ["Permitir retry claro ao usuário", "Travar o app permanentemente", "Apagar a venda", "Reiniciar o SO"], correct: 0, chunk: "tap-to-mobile-guidelines", anchor: "ux-pagamento" },
  ],
  pleno: [
    { prompt: "Qual campo ISO 8583 carrega dados EMV tipicamente?", options: ["DE 55", "DE 1", "DE 99", "DE 0"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-3-integracao", explanation: "DE 55 transporta TLVs EMV na autorização." },
    { prompt: "O kernel EMV no BtgPay é:", options: ["Licenciado e certificado, não reimplementado em Dart", "Escrito do zero em Flutter", "Opcional para contactless", "Substituído por REST"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-2-kernel" },
    { prompt: "GPO no fluxo EMV significa:", options: ["Get Processing Options", "General Payment Output", "Global POS Operation", "Gateway Protocol Only"], correct: 0, chunk: "contactless-tap-mobile", anchor: "contactless-overview" },
    { prompt: "CPoC refere-se a certificação para:", options: ["Contactless Payment on COTS", "Card Payment on Cloud", "Central Processing of Cards", "Consumer PIN on Chip"], correct: 0, chunk: "seguranca-terminal", anchor: "ambiente-seguro" },
    { prompt: "Torn transaction ocorre quando:", options: ["Transação contactless é interrompida e precisa retomar", "Cartão é de outro país", "Não há internet", "PIN está errado uma vez"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-2-kernel" },
    { prompt: "Platform channel no Flutter serve para:", options: ["Chamar SDK nativo de pagamentos", "Estilizar botões", "Cache de imagens", "Animações Lottie"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "camadas-app" },
    { prompt: "Floor limit define:", options: ["Valor acima do qual autorização online pode ser exigida", "Tamanho da tela", "Número de parcelas máximo", "Cor do terminal"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-2-kernel" },
    { prompt: "Play Integrity / DeviceCheck são usados para:", options: ["Attestation de integridade do app", "Geolocalização", "Push notifications", "Temas dark mode"], correct: 0, chunk: "tap-to-mobile-guidelines", anchor: "attestation" },
    { prompt: "Múltiplos cartões no campo NFC causa:", options: ["Anticolisão e erro de leitura", "Aprovação automática", "Dobro do valor", "Ignorar CDCVM"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "erros-comuns" },
    { prompt: "Reduzir escopo PCI implica:", options: ["App não armazena PAN em claro", "Eliminar HTTPS", "Logar track data", "Salvar CVV"], correct: 0, chunk: "seguranca-terminal", anchor: "pci-escopo" },
    { prompt: "VCPS/M-TIP são programas de:", options: ["Bandeiras além do EMVCo base", "Impostos", "Frete", "RH"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "labs-aprovados" },
    { prompt: "SELECT no EMV serve para:", options: ["Escolher aplicação (AID) no cartão", "Selecionar cor do UI", "Escolher servidor DNS", "Filtrar produtos"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "fluxo-transacao-chip" },
    { prompt: "Autorização offline vs online é decidida por:", options: ["Regras do kernel e capacidades do cartão/terminal", "Usuário no Instagram", "Hora do almoço", "Tamanho do APK"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-2-kernel" },
    { prompt: "Mudança no fluxo de PIN no app:", options: ["Pode exigir reteste de certificação", "Nunca impacta certificação", "Só afeta iOS", "É só visual"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "custo-complexidade" },
    { prompt: "DUKPT é usado para:", options: ["Derivação de chaves de sessão por transação", "Design de UI", "Download de catálogo", "GPS"], correct: 0, chunk: "seguranca-terminal", anchor: "key-management" },
    { prompt: "ISO 14443 relaciona-se a:", options: ["Contactless RF", "Chip com contato apenas", "Wi-Fi", "4G"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-1-fisico" },
    { prompt: "Completion da transação EMV:", options: ["Finaliza após decisão de autorização", "Ocorre antes de ler o cartão", "Substitui o kernel", "É só impressão"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "fluxo-transacao-chip" },
    { prompt: "3DS está mais associado a:", options: ["CNP / e-commerce", "Tap contactless", "PIN offline", "Leitura de chip contato"], correct: 0, chunk: "fundamentos-cnp-cp", anchor: "definicao-cnp" },
    { prompt: "Callback do SDK deve:", options: ["Ser a única fonte de verdade do resultado", "Ser ignorado se UI já mostrou sucesso", "Vir apenas do widget", "Ser mockado em produção"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "estados-transacao" },
    { prompt: "Reteste EMV após falha em caso de teste:", options: ["É comum e deve ser planejado no cronograma", "Nunca acontece", "Elimina certificação", "Só em L1"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "timeline-certificacao" },
  ],
  senior: [
    { prompt: "Ao modelar estorno no mobile POS, o dev deve:", options: ["Seguir API do adquirente e estados do kernel, sem reutilizar cryptograma original", "Repetir ARQC da venda", "Logar PAN completo", "Bypass do SDK"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "estados-transacao", explanation: "Estorno tem fluxo próprio; dados EMV não são replicados da venda original." },
    { prompt: "Impacto de alterar method channel contract:", options: ["Quebra integração nativa e pode invalidar cenários L3", "Só afeta ícones", "É transparente ao lab", "Não precisa versionar"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "camadas-app" },
    { prompt: "TEE/StrongBox no SoftPOS:", options: ["Protege chaves e operações criptográficas sensíveis", "É só para jogos", "Substitui EMVCo", "Opcional sem consequência"], correct: 0, chunk: "seguranca-terminal", anchor: "ambiente-seguro" },
    { prompt: "Estratégia de observabilidade em pagamentos:", options: ["Correlation ID + códigos de resposta sem dados sensíveis", "Log completo do DE 55", "PAN truncado em Slack público", "Screenshot do cartão"], correct: 0, chunk: "seguranca-terminal", anchor: "pci-escopo" },
    { prompt: "Torniquete em contactless visa:", options: ["Evitar transações incompletas no campo RF", "Aumentar limite sem CVM", "Desativar NFC", "Forçar chip contato"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-2-kernel" },
    { prompt: "AAC vs TC vs ARQC indicam:", options: ["Decisões criptográficas do cartão (decline/offline/online)", "Cores do tema", "Tipos de produto", "Idiomas"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "chip-vs-tarja" },
    { prompt: "Host adquirente no L3 valida:", options: ["Mensageria, campos EMV e cenários de host", "Apenas splash screen", "Fonte do app", "Reviews na loja"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-3-integracao" },
    { prompt: "Feature flag em fluxo de pagamento certificado:", options: ["Deve ser avaliada quanto a impacto regulatório", "Pode mudar kernel", "Ignora lab", "Substitui L2"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "custo-complexidade" },
    { prompt: "Anticolisão NFC (ISO 14443) falha quando:", options: ["Múltiplas tags no campo. UX deve instruir afastar outros cartões", "PIN errado", "Sem bateria no servidor", "App em background"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "erros-comuns" },
    { prompt: "Tokenização no comerciante:", options: ["Reduz exposição de PAN fora do boundary seguro", "Elimina necessidade de HTTPS", "Substitui certificação", "Armazena CVV"], correct: 0, chunk: "seguranca-terminal", anchor: "pci-escopo" },
    { prompt: "Cenário: app mostra aprovado antes do callback final. Risco:", options: ["Venda fantasma e não conformidade", "Melhor UX sempre", "Sem impacto", "Só estético"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "estados-transacao" },
    { prompt: "Reconciliação de transações contactless:", options: ["Depende de registros do adquirente + IDs do terminal", "Só cor do botão", "Manual sempre", "Ignorada em SoftPOS"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-3-integracao" },
    { prompt: "Patch de segurança do SO exigido porque:", options: ["Vulnerabilidades comprometem ambiente de pagamento", "Muda ícones", "É marketing", "Opcional"], correct: 0, chunk: "tap-to-mobile-guidelines", anchor: "requisitos-dispositivo" },
    { prompt: "CVM List no EMV define:", options: ["Métodos de verificação do portador aceitos", "Lista de produtos", "Cores do terminal", "DNS"], correct: 0, chunk: "contactless-tap-mobile", anchor: "cdcvm" },
    { prompt: "Arquitetura limpa no BtgPay isola:", options: ["Domínio de venda do adapter de pagamento", "Widgets de cor", "Gradle do Android no Dart", "Logs no domain"], correct: 0, chunk: "btgpay-flutter-pratica", anchor: "camadas-app" },
    { prompt: "Pré-testes internos antes do lab:", options: ["Reduzem ciclo de reteste e custo", "Substituem L2", "São proibidos", "Só para tarja"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "timeline-certificacao" },
    { prompt: "DE 55 contém tipicamente:", options: ["TLVs EMV como tags do chip", "Foto do cartão", "Senha do lojista", "HTML"], correct: 0, chunk: "certificacao-l1-l2", anchor: "level-3-integracao" },
    { prompt: "Dispositivo fora da lista de suporte do SDK:", options: ["Não deve transacionar mesmo com NFC presente", "Funciona igual", "Só iOS", "Modo debug ok"], correct: 0, chunk: "tap-to-mobile-guidelines", anchor: "requisitos-dispositivo" },
    { prompt: "Offline decline (AAC) significa:", options: ["Cartão/terminal recusou sem ir ao host", "Aprovação garantida", "Erro de UI", "Timeout de rede apenas"], correct: 0, chunk: "fundamentos-emv-chip", anchor: "chip-vs-tarja" },
    { prompt: "Versionamento do SDK de pagamento:", options: ["Deve ser pinado e testado em matriz de regressão", "Sempre latest", "Ignorado", "Só semver visual"], correct: 0, chunk: "certificacao-niveis-payfelix", anchor: "custo-complexidade" },
  ],
};

function expandBank(level, bank, targetCount = 50) {
  const questions = [];
  let i = 0;
  while (questions.length < targetCount) {
    const base = bank[i % bank.length];
    const suffix = questions.length >= bank.length ? ` (var. ${Math.floor(questions.length / bank.length) + 1})` : "";
    questions.push({
      id: `${level}-${String(questions.length + 1).padStart(3, "0")}`,
      level,
      difficulty: level === "junior" ? 1 : level === "pleno" ? 2 : 3,
      prompt: base.prompt + (suffix && questions.length >= bank.length ? "" : ""),
      options: base.options,
      correctIndex: base.correct,
      explanation: base.explanation || "Consulte o material fonte para aprofundar.",
      sourceChunkId: base.chunk,
      anchorId: base.anchor,
    });
    i++;
    if (questions.length >= bank.length && questions.length < targetCount) {
      const variant = { ...base, prompt: `[Revisão] ${base.prompt}` };
      questions[questions.length - 1].prompt = variant.prompt;
    }
  }
  return questions.slice(0, targetCount);
}

function loadChunks() {
  if (!existsSync(CHUNKS_DIR)) return [];
  return readdirSync(CHUNKS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(readFileSync(join(CHUNKS_DIR, f), "utf-8")))
    .filter((c) => c.id && c.sections);
}

function generateFromChunks(chunks, level, startId) {
  const extra = [];
  for (const chunk of chunks) {
    for (const section of chunk.sections || []) {
      if (extra.length >= 10) break;
      extra.push({
        id: `${level}-auto-${extra.length + 1}`,
        level,
        difficulty: level === "senior" ? 3 : level === "pleno" ? 2 : 1,
        prompt: `Segundo o material "${chunk.title}", sobre "${section.heading}": qual afirmação está alinhada ao conteúdo?`,
        options: [
          "O texto aborda este tópico no contexto EMV/BtgPay",
          "EMV não se aplica a POS mobile",
          "O Flutter implementa o kernel EMV",
          "Certificação é opcional para tap",
        ],
        correctIndex: 0,
        explanation: `Revise a seção "${section.heading}" no material fonte.`,
        sourceChunkId: chunk.id,
        anchorId: section.anchorId,
      });
    }
  }
  return extra;
}

function main() {
  mkdirSync(QUIZZES_DIR, { recursive: true });
  const chunks = loadChunks();

  for (const level of ["junior", "pleno", "senior"]) {
    const base = expandBank(level, QUESTION_BANK[level], 40);
    const auto = generateFromChunks(chunks, level, base.length);
    const combined = [...base, ...auto].slice(0, 50);

    while (combined.length < 50) {
      const b = QUESTION_BANK[level][combined.length % QUESTION_BANK[level].length];
      combined.push({
        id: `${level}-${String(combined.length + 1).padStart(3, "0")}`,
        level,
        difficulty: level === "junior" ? 1 : level === "pleno" ? 2 : 3,
        prompt: b.prompt,
        options: b.options,
        correctIndex: b.correct,
        explanation: b.explanation || "Consulte o material fonte.",
        sourceChunkId: b.chunk,
        anchorId: b.anchor,
      });
    }

    writeFileSync(
      join(QUIZZES_DIR, `${level}.json`),
      JSON.stringify({ level, questions: combined }, null, 2)
    );
    console.log(`Generated ${combined.length} questions for ${level}`);
  }
}

main();
