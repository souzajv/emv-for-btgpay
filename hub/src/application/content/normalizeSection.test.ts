import { describe, it, expect } from "vitest";
import { isBoilerplate, normalizeSection } from "./normalizeSection";

describe("isBoilerplate", () => {
  it("detects EMVCo copyright lines", () => {
    expect(
      isBoilerplate("© 1994-2023 EMVCo, LLC. All rights reserved.")
    ).toBe(true);
    expect(isBoilerplate("EMV Guidelines Page 2 / 32")).toBe(true);
  });

  it("allows technical content", () => {
    expect(isBoilerplate("PIN deve processar-se em ambiente seguro certificado.")).toBe(
      false
    );
  });
});

describe("normalizeSection", () => {
  it("passes through structured sections", () => {
    const result = normalizeSection({
      anchorId: "a",
      heading: "Test",
      bodyMd: "Conteúdo de estudo limpo.",
      btgpayNote: "Nota BtgPay.",
      verification: {
        evidence: "trecho técnico",
        sourceRel: "content/raw/foo.json",
        status: "OK",
      },
    });
    expect(result.bodyMd).toBe("Conteúdo de estudo limpo.");
    expect(result.btgpayNote).toBe("Nota BtgPay.");
    expect(result.verification?.status).toBe("OK");
  });

  it("splits legacy markdown blocks", () => {
    const result = normalizeSection({
      anchorId: "ambiente-seguro",
      heading: "Ambiente seguro",
      bodyMd: `### Resumo acadêmico

Dados sensíveis devem processar-se em ambiente seguro.

Esta seção aborda **Ambiente seguro** no contexto das especificações EMV.

### Detalhes técnicos

**Extrato estruturado da fonte:**
- © 1994-2023 EMVCo, LLC. All rights reserved.

### Contexto BtgPay

Nota para o time mobile.

### Verificação na fonte

- Evidência: "ambiente seguro certificado"
- Fonte: \`content/raw/foo.json\`
- Status: OK`,
    });
    expect(result.bodyMd).toContain("ambiente seguro");
    expect(result.bodyMd).not.toContain("Resumo acadêmico");
    expect(result.btgpayNote).toBe("Nota para o time mobile.");
    expect(result.verification?.sourceRel).toBe("content/raw/foo.json");
  });
});
