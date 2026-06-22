import type { Metadata } from "next";

import { readFileSync, existsSync } from "fs";

import { join } from "path";

import { contentRepo } from "@/infrastructure";

import { buildVerificationTree } from "@/application/content/verificationTree";

import { SectionHead } from "@/presentation/components/SectionHead";

import { BrutalCard } from "@/presentation/components/BrutalCard";

import { SourceVerificationAccordions } from "@/presentation/components/SourceVerificationAccordions";



export const metadata: Metadata = {

  title: "Sobre",

  description: "Fontes, disclaimers e como atualizar o HUB EMV BtgPay.",

};



const SOURCES = [

  "https://payfelix.com/emv-certification-levels/",

  "https://stripe.com/br/resources/more/what-are-emv-chip-cards",

  "https://stripe.com/br/resources/more/what-are-card-not-present-transactions",

  "https://www.emvco.com/knowledge-hub/what-are-emv-level-1-and-level-2-testing/",

  "https://www.emvco.com/emv-technologies/mobile/",

  "EMV Acquirer and Terminal Security Guidelines v2.0",

  "EMV Issuer and Application Security Guidelines v3.0",

  "Tap to Mobile Guidelines v1.1",

];



function loadSynthesisSummary() {

  const reportPath = join(process.cwd(), "..", "content", "_meta", "synthesis-report.json");

  if (!existsSync(reportPath)) return null;

  try {

    const report = JSON.parse(readFileSync(reportPath, "utf-8"));

    return report.summary as {

      total: number;

      pass: number;

      gaps: number;

    };

  } catch {

    return null;

  }

}



export default async function SobrePage() {

  const tracks = await contentRepo.getAllTracks();

  const chunks = await contentRepo.getAllChunks();

  const chunkMap = new Map(chunks.map((c) => [c.id, c]));

  const verificationTree = buildVerificationTree(tracks, chunkMap);

  const summary = loadSynthesisSummary();



  return (

    <div className="max-w-3xl mx-auto px-6 py-20">

      <SectionHead

        tag="SOBRE"

        title="HUB EMV BtgPay"

        intro="Material de capacitação interna para o time mobile Flutter. Conteúdo agregado de fontes públicas e PDFs oficiais, curado para contexto POS."

      />



      <BrutalCard className="mt-8">

        <h2 className="font-bold text-lg">Validação de fontes</h2>

        <p className="mt-2 text-sm text-muted">

          Evidências técnicas que sustentam cada seção do material, organizadas por trilha e

          módulo. Detalhes de copyright e metadados de pipeline não aparecem na leitura do

          módulo.

        </p>

        {summary && (

          <p className="mt-2 font-mono text-xs text-muted">

            {summary.pass}/{summary.total} materiais verificados · {summary.gaps} com gaps

          </p>

        )}

        <SourceVerificationAccordions tracks={verificationTree} />

      </BrutalCard>



      <BrutalCard className="mt-6">

        <h2 className="font-bold text-lg">Fontes</h2>

        <ul className="mt-4 space-y-2 text-sm text-muted list-disc pl-5">

          {SOURCES.map((s) => (

            <li key={s}>{s}</li>

          ))}

        </ul>

      </BrutalCard>

      <BrutalCard className="mt-6">

        <h2 className="font-bold text-lg">Atualizar conteúdo</h2>

        <p className="mt-2 text-sm text-muted">

          Na pasta <code className="bg-highlight px-1 border border-ink">pipeline/</code>, execute{" "}

          <code className="bg-highlight px-1 border border-ink">npm run pipeline</code> para

          re-raspar sites e PDFs, depois{" "}

          <code className="bg-highlight px-1 border border-ink">node synthesize-chunks.mjs</code>,{" "}

          <code className="bg-highlight px-1 border border-ink">node verify-chunk-claims.mjs</code> e{" "}

          <code className="bg-highlight px-1 border border-ink">npm run build</code> no hub.

        </p>

      </BrutalCard>

      <BrutalCard className="mt-6">

        <h2 className="font-bold text-lg">Disclaimer</h2>

        <p className="mt-2 text-sm text-muted">

          Este hub é ferramenta de estudo interna. Em caso de divergência, prevalecem os

          documentos oficiais EMVCo, bandeiras e políticas do adquirente BtgPay.

        </p>

      </BrutalCard>

    </div>

  );

}

