export const SEED_URLS = [
  {
    domain: "payfelix.com",
    seeds: ["https://payfelix.com/emv-certification-levels/"],
    pathPrefix: "/emv",
    maxPages: 30,
  },
  {
    domain: "stripe.com",
    seeds: [
      "https://stripe.com/br/resources/more/what-are-emv-chip-cards",
      "https://stripe.com/br/resources/more/what-are-card-not-present-transactions",
    ],
    pathPrefix: "/br/resources/",
    maxPages: 50,
  },
  {
    domain: "emvco.com",
    seeds: [
      "https://www.emvco.com/knowledge-hub/what-are-emv-level-1-and-level-2-testing/",
      "https://www.emvco.com/emv-technologies/mobile/",
    ],
    pathPrefix: null,
    maxPages: 80,
  },
];

export const RATE_LIMIT_MS = 1500;
export const USER_AGENT = "EMV-BtgPay-Hub-Crawler/1.0 (internal training; educational)";
