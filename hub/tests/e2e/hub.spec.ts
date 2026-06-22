import { test, expect } from "@playwright/test";

test("home page loads and links to trilhas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /EMV para/i })).toBeVisible();
  await page.getByRole("link", { name: /COMEÇAR TRILHAS/i }).click();
  await expect(page).toHaveURL(/\/trilhas/);
});

test("quiz level page loads", async ({ page }) => {
  await page.goto("/quiz/junior/");
  await expect(page.getByText(/PERGUNTA 1/i)).toBeVisible({ timeout: 10000 });
});

test("material page opens without error", async ({ page }) => {
  await page.goto("/material/seguranca-terminal/");
  await expect(
    page.getByRole("heading", { name: /Segurança de terminal e adquirente/i })
  ).toBeVisible();
  await expect(page.getByText(/Resumo acadêmico/i)).not.toBeVisible();
  await expect(page.getByText(/Verificação na fonte/i)).not.toBeVisible();
  await expect(page.getByText(/Detalhes técnicos/i)).not.toBeVisible();
});

test("material from module shows only scoped section", async ({ page }) => {
  await page.goto(
    "/material/seguranca-terminal/?track=seguranca-terminal&module=mod-ambiente-seguro&sections=ambiente-seguro"
  );
  await expect(
    page.getByRole("heading", { name: /Ambiente seguro de execução/i })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Escopo PCI/i })).not.toBeVisible();
});

test("sobre page shows source verification accordions", async ({ page }) => {
  await page.goto("/sobre/");
  await expect(page.getByText(/Validação de fontes/i)).toBeVisible();
  await expect(
    page.locator("summary").filter({ hasText: "Segurança de Terminal" })
  ).toBeVisible();
});

test("module card is fully clickable", async ({ page }) => {
  await page.goto("/trilhas/seguranca-terminal/");
  const card = page.getByRole("link", { name: /Módulo 1: Ambiente seguro/i });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/material\/seguranca-terminal/);
});

test("navigation shows loading bar on internal link", async ({ page }) => {
  await page.goto("/");
  const navPromise = page.waitForURL(/\/trilhas/, { timeout: 15000 });
  await page.getByRole("link", { name: /COMEÇAR TRILHAS/i }).click();
  const bar = page.locator(".fixed.top-0.left-0.right-0.h-1");
  await expect(bar).toBeVisible({ timeout: 3000 });
  await navPromise;
});

test("module progress is scoped and requires explicit completion", async ({ page }) => {
  await page.goto("/trilhas/seguranca-terminal/");
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("emv-hub-")) localStorage.removeItem(key);
    }
  });

  await page.getByRole("link", { name: /Módulo 1: Ambiente seguro/i }).click();
  await expect(page.getByText(/Material em leitura/i)).toBeVisible();
  await expect(page.getByText(/50%/)).toBeVisible();
  await expect(page.getByText(/Módulo concluído/i)).not.toBeVisible();

  await page.goto("/trilhas/seguranca-terminal/");
  const mod2 = page.getByRole("link", { name: /Módulo 2: Escopo PCI/i });
  await expect(mod2).toBeVisible();
  await expect(mod2.getByText("0%")).toBeVisible();

  await page.getByRole("link", { name: /Módulo 1: Ambiente seguro/i }).click();
  await page.getByRole("button", { name: /Concluir módulo/i }).click();
  await expect(page.getByText(/Módulo concluído/i)).toBeVisible();
  await expect(page.getByText(/100%/)).toBeVisible();

  await page.goto("/trilhas/seguranca-terminal/");
  await expect(
    page.getByRole("link", { name: /Módulo 1: Ambiente seguro/i }).getByText("100%")
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Módulo 2: Escopo PCI/i }).getByText("0%")
  ).toBeVisible();
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("quiz list has no horizontal overflow", async ({ page }) => {
    await page.goto("/quiz/");
    await expect(page.getByRole("heading", { name: /Validar conhecimento/i })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });

  test("quiz session fits mobile width", async ({ page }) => {
    await page.goto("/quiz/junior/");
    await expect(page.getByText(/PERGUNTA 1/i)).toBeVisible({ timeout: 10000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });
});
