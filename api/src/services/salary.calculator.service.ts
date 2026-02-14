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

    const tax = Math.round(taxBase * 0.10); // matches 2506.8 -> 2507
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
