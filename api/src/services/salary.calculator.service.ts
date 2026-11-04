export function netToGrossMK(net: number, personalAllowance = 10932): number {
    const netContribRate = 1 - (0.188 + 0.075 + 0.012 + 0.005); // 0.72

    // Analytical approximation
    let approxGross: number;
    if (net / netContribRate <= personalAllowance) {
        // No-tax bracket
        approxGross = Math.round(net / netContribRate);
    } else {
        // Taxed bracket: net ≈ grossAfterContrib * 0.90 + personalAllowance * 0.10
        approxGross = Math.round((net - personalAllowance * 0.10) / (netContribRate * 0.90));
    }

    // Search ±3 to handle rounding in grossToNetMK
    for (let delta = -3; delta <= 3; delta++) {
        const candidate = approxGross + delta;
        if (grossToNetMK(candidate, personalAllowance).net === net) {
            return candidate;
        }
    }

    return approxGross;
}

type Breakdown = {
    gross: number;
    pension: number;
    health: number;
    unemployment: number;
    injury: number;
    contributionsTotal: number;
    grossAfterContrib: number;
    personalAllowance: number;
    taxBase: number;
    tax: number;
    net: number;
};

export function grossToNetMK(
    gross: number,
    personalAllowance = 10932
): Breakdown {
    const pensionRate = 0.188;
    const healthRate = 0.075;
    const unemploymentRate = 0.012;
    const injuryRate = 0.005;

    const pension = gross * pensionRate;
    const health = gross * healthRate;
    const unemployment = gross * unemploymentRate;
    const injury = gross * injuryRate;

    const contributionsTotal = pension + health + unemployment + injury;
    const grossAfterContrib = gross - contributionsTotal;

    const taxBaseRaw = grossAfterContrib - personalAllowance;
    const taxBase = Math.max(0, taxBaseRaw);

    const tax = Math.round(taxBase * 0.10);
    const net = Math.round(grossAfterContrib - tax);

    return {
        gross,
        pension,
        health,
        unemployment,
        injury,
        contributionsTotal,
        grossAfterContrib,
        personalAllowance,
        taxBase,
        tax,
        net,
    };
}

// MKD is pegged to EUR by the National Bank of North Macedonia (stable since 1997)
export const EUR_TO_MKD_RATE = 61.3;

// The four salary fields stored on an application, from the expected net salary in EUR
export function applicationSalaryFromNetEur(netEur: number) {
  const netMkd = Math.round(netEur * EUR_TO_MKD_RATE);
  const grossMkd = netToGrossMK(netMkd);
  const { net: verifiedNetMkd } = grossToNetMK(grossMkd);
  return {
    salaryNetEur: netEur,
    salaryNetMkd: verifiedNetMkd,
    salaryGrossMkd: grossMkd,
    salaryGrossEur: Math.round(grossMkd / EUR_TO_MKD_RATE),
  };
}
