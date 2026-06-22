/**
 * Parágrafos PT curados para páginas EMVCo com scrape pobre (só imagem ou navegação).
 * Chave: chunkId → anchorId → bodyMd
 */
export const CURATED_SECTIONS = {
  "emvco-com-why-emv": {
    "conteudo-principal":
      "O padrão EMV substitui a tarja estática por chip ou token dinâmico, reduzindo clonagem e fraude em cartão presente. Emissores, adquirentes e fabricantes de terminal alinham-se às especificações EMVCo para interoperabilidade global: o mesmo cartão deve funcionar em qualquer POI homologado.\n\nPara o BtgPay, entender por que EMV existe orienta decisões de produto: liability shift, obrigatoriedade de chip/contactless e investimento em certificação L1/L2/L3 do stack mobile.",
  },
  "emvco-com-overview-of-emvco": {
    "conteudo-principal":
      "A EMVCo é o consórcio que mantém especificações de chip, contactless, tokenização, 3-D Secure e comércio remoto seguro. Participam bandeiras, emissores, adquirentes, fabricantes de terminal e laboratórios de teste. O objetivo é um ecossistema único com regras claras de certificação e trademark.\n\nTimes mobile consultam a EMVCo para saber qual processo de aprovação se aplica a kernel, dispositivo NFC ou solução Tap to Mobile antes de planejar homologação com o adquirente.",
  },
  "emvco-com-product-approval-process": {
    "conteudo-principal":
      "O processo de aprovação de produto EMVCo cobre componentes que entram no fluxo de pagamento: kernels, leitores, módulos RF e ferramentas de teste. Cada produto passa por avaliação documental e testes em laboratório reconhecido antes de constar em listas oficiais.\n\nNo contexto POS smartphone, aprovação de produto distingue o que é certificado (hardware NFC, kernel, PPSE) do que o app Flutter apenas integra via SDK.",
  },
  "emvco-com-contact-kernel-approval-process": {
    "conteudo-principal":
      "Kernels EMV de contato (chip físico) seguem roteiro próprio de aprovação: casos de transação com inserção, CVM offline/online, fallback e geração de cryptograma. Fabricantes e licenciadores de kernel submetem builds versionados; mudanças exigem reteste.\n\nEmbora o BtgPay foque contactless, o kernel de contato compartilha conceitos (AID, GPO, ARQC) úteis para debug e suporte a cenários híbridos.",
  },
  "emvco-com-contactless-product-approval-process": {
    "conteudo-principal":
      "Produtos contactless (ISO 14443) passam por aprovação de RF, timing, anticolisão e interoperabilidade com cartões de referência EMVCo. Wearables e smartphones com NFC entram em variantes do processo quando atuam como POI.\n\nTap to Mobile e SoftPOS dependem desta linha de aprovação somada a requisitos CPoC/VCPS das bandeiras.",
  },
  "emvco-com-mobile-level-1-approval-process": {
    "conteudo-principal":
      "Mobile Level 1 valida a camada física/protocolo NFC do smartphone ou periférico usado como terminal. Inclui desempenho RF, compatibilidade com cartões EMV contactless e requisitos de hardware definidos para COTS (Commercial Off-The-Shelf).\n\nO app BtgPay não certifica L1 sozinho: o OEM, módulo NFC ou solução completa submete o dispositivo a laboratório EMVCo ou programa de bandeira equivalente.",
  },
  "emvco-com-mobile-cmp-ppse-approval-process": {
    "conteudo-principal":
      "CMP (Card Memory Protection) e PPSE (Proximity Payment System Environment) estruturam como aplicações de pagamento são expostas no ambiente mobile seguro. Aprovação garante que seleção de AID e dados apresentados ao cartão seguem o modelo EMV contactless.\n\nIntegradores Flutter dependem do SDK para PPSE correto; alterações na lista de AIDs ou na configuração exigem validação com o provedor do kernel.",
  },
  "emvco-com-wearable-level-1-approval-process": {
    "conteudo-principal":
      "Wearables com pagamento contactless (relógios, pulseiras) seguem Level 1 adaptado ao formato e antena RF reduzida. Testes verificam leitura confiável e conformidade elétrica em geometrias não tradicionais.\n\nÚtil como referência para UX de aproximação e limites de campo magnético ao desenhar instruções de tap no app.",
  },
  "emvco-com-laboratory-recognition-process": {
    "conteudo-principal":
      "Laboratórios só executam testes oficiais EMVCo após reconhecimento formal: capacidade técnica, equipamentos, treinamento e auditoria periódica. Fabricantes escolhem labs da lista publicada para cada tipo de certificação (L1, L2, L3, kernel, contactless).\n\nCronograma BtgPay deve reservar fila de lab e retestes; mudanças de kernel ou firmware NFC reiniciam ciclos de aprovação.",
  },
  "emvco-com-l3-test-tool-qualification-process": {
    "conteudo-principal":
      "Ferramentas usadas em testes Level 3 (simuladores de host, cartões virtuais, coletores de log) precisam ser qualificadas para garantir repetibilidade dos casos EMVCo e de bandeira. ISVs e adquirentes usam essas ferramentas antes de submeter o terminal ao lab.\n\nO time mobile beneficia ao exigir logs e artefatos de teste L3 compatíveis com as ferramentas homologadas pelo programa.",
  },
  "emvco-com-test-platform-provider-qualification-and-recogniti": {
    "conteudo-principal":
      "Provedores de plataforma de teste oferecem ambientes automatizados para regressão EMV. A qualificação EMVCo assegura que scripts e resultados são aceitos em auditorias de certificação.\n\nEm CI/CD de SDK, alinhar suites internas a plataformas reconhecidas reduz surpresas na homologação final.",
  },
  "emvco-com-qualification-service-provider": {
    "conteudo-principal":
      "Qualification Service Providers (QSP) apoiam fabricantes na preparação documental e execução de pré-testes antes da submissão oficial. Atuam como consultoria técnica especializada em roteiros EMVCo.\n\nProduto BtgPay pode contratar QSP para acelerar ciclos L2/L3 quando houver mudanças frequentes no bridge nativo.",
  },
  "emvco-com-approved-evaluated": {
    "functional-approval":
      "Functional Approval lista combinações aprovadas de componentes (kernel + hardware + aplicação) que passaram em testes funcionais integrados. Diferente de aprovação isolada de um módulo, valida o conjunto que será implantado em produção.\n\nAo escolher SDK e modelo de smartphone suportado, verifique se a combinação consta em listas de aprovação funcional do adquirente ou bandeira.",
  },
  "emvco-com-emv-level-3-testing": {
    "conteudo-principal":
      "O teste Level 3 (L3) valida a integração completa: terminal, kernel, aplicação de pagamento, host do adquirente e redes de bandeira. Cenários incluem aprovação, negação, offline, estorno e tratamento de DE 55 (TLV EMV) na autorização.\n\nPara POS mobile, L3 é o gate final antes de pilotos em loja: o app Flutter deve refletir estados corretos enquanto o SDK executa o protocolo EMV.",
  },
  "emvco-com-what-is-emv-level-3-testing": {
    "conteudo-principal":
      "EMV Level 3 concentra-se na aplicação de pagamento e na mensageria com o host, após hardware (L1) e kernel (L2) aprovados. Testes simulam transações reais com cartões físicos ou virtuais e validam conformidade com regras de cada esquema.\n\nPlaneje L3 quando o kernel estiver congelado e o fluxo de UI estiver estável; mudanças tardias em PIN, valor ou timeout costumam exigir reteste.",
  },
  "emvco-com-emv-secure-remote-commerce": {
    "conteudo-principal":
      "EMV Secure Remote Commerce (SRC) padroniza checkout digital com token de cartão e experiência consistente entre comerciantes, sem expor PAN em cada loja. Complementa 3-D Secure em jornadas e-commerce e wallet.\n\nNão confunda SRC com Tap to Mobile: SRC é CNP; o BtgPay POS atua em CP/contactless, mas o conhecimento ajuda em produtos híbridos.",
  },
  "emvco-com-emv-payment-tokenisation": {
    "conteudo-principal":
      "Tokenização EMV substitui o PAN por um token de uso restrito (dispositivo, comerciante ou domínio), limitando impacto de vazamentos. Regras cobrem provisionamento, cryptograma e lifecycle do token em wallets e e-commerce.\n\nEm mobile, tokens aparecem em Apple Pay/Google Pay; o terminal contactless consome token como cartão EMV com criptograma dinâmico.",
  },
  "emvco-com-emv-qr-codes": {
    "conteudo-principal":
      "EMV QR Codes padronizam pagamentos via QR com payload seguro, permitindo interoperabilidade entre emissor, adquirente e carteiras. Variantes incluem merchant-present e customer-present.\n\nRelevante quando o BtgPay expandir para leitura de QR de pagamento além de NFC, mantendo separação clara entre fluxo QR e EMV contactless.",
  },
  "emvco-com-emv-electric-vehicle-open-payments-evop": {
    "conteudo-principal":
      "EV Open Payments (EVOP) adapta EMV contactless para recarga de veículos elétricos: o carregador atua como POI, o motorista aproxima cartão ou wallet e a liquidação segue fluxo de pagamento padrão com cryptograma dinâmico.\n\nO modelo reutiliza ISO 14443 e kernel contactless, demonstrando como o mesmo stack EMV se estende a verticais além de varejo. Para o BtgPay, é referência de como novos POIs mobile podem herdar certificações contactless existentes.",
  },
  "emvco-com-industry-partners-liaisons": {
    "conteudo-principal":
      "EMVCo colabora com PCI SSC, ISO, redes regionais e reguladores via acordos de liaison. O objetivo é alinhar segurança, interoperabilidade e requisitos locais sem fragmentar o padrão global.\n\nTimes de compliance BtgPay cruzam requisitos PCI PTS/CPoC com publicações EMVCo citadas nestas parcerias.",
  },
  "emvco-com-trademark-centre": {
    "marks-promote-payment-trust-familiarity-and-consistency":
      "Marcas EMV® e indicadores visuais sinalizam ao portador que o terminal aceita chip/contactless com segurança reconhecida. Uso indevido de trademark é regulado pela EMVCo.\n\nMarketing do app BtgPay deve seguir guias de marca do adquirente e bandeira, exibindo símbolos contactless apenas em dispositivos homologados.",
  },
  "payfelix-com-emv-certification-levels": {
    "1-level-1-certification-terminal-integration-process-tip":
      "A certificação Level 1 (TIP) valida aspectos físicos e elétricos do terminal e a comunicação com cartões EMV (chip ou NFC). O fabricante do hardware ou módulo NFC é responsável pelo Level 1 e pela homologação em laboratório acreditado.\n\nTestes cobrem especificações elétricas, protocolo RF (ISO 14443) ou contato (ISO 7816), anticolisão e leitura de cartão. Aprovação L1 indica conformidade de hardware; o produto pode avançar para certificação Level 2 do kernel EMV.",
    "2-level-2-certification-kernel-integration-process-kip":
      "A certificação Level 2 (KIP) valida o kernel EMV: seleção de AID, CVM, cryptograma (ARQC/TC/AAC) e regras de transação. Fornecedores de kernel ou integradores de software certificam o componente EMV que roda no terminal ou no SDK mobile.\n\nCenários incluem leitura de cartão, processamento offline/online, tipos de cartão e operações criptográficas exigidas pelo padrão. Kernel aprovado em L2 pode ser integrado a aplicações de pagamento sujeitas ao Level 3.",
    "3-level-3-certification-application-integration-process-aip":
      "A certificação Level 3 (AIP) valida a integração ponta a ponta entre aplicação de pagamento, kernel, host do adquirente e bandeiras. Adquirente, processador ou ISV responsável pela aplicação conduz testes de integração com o terminal homologado.\n\nFluxo completo: inserção ou tap, autorização, DE 55 (TLV EMV), ISO 8583, estorno e reconciliação conforme roteiros da bandeira. Terminal e aplicação ficam prontos para produção com interoperabilidade EMV nas redes acordadas.",
  },
  "payfelix-com-how-to-offer-an-emv-payment-solution-on-your-de": {
    "traditional-integration-is-a-headache":
      "Integrar EMV do zero exige kernel certificado, stack NFC, HSM, certificação L1/L2/L3 e manutenção contínua. Por isso ISVs mobile costumam licenciar SDK SoftPOS/Tap to Mobile em vez de implementar protocolo EMV na camada Flutter.\n\nO BtgPay segue este modelo: app de apresentação + bridge nativo + provedor certificado, reduzindo tempo até produção.",
  },
};

export function getCuratedSection(chunkId, anchorId) {
  return CURATED_SECTIONS[chunkId]?.[anchorId] ?? null;
}
