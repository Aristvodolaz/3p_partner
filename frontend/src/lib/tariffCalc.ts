import type { Operation, PartnerTariff, TariffCoefficient } from '@/types/sku';

/** Подбирает коэффициент К0-К5 по сумме трёх сторон (ШДВ), см */
export function getSizeCoefficient(
  sumOfSides: number | undefined,
  coefficients: TariffCoefficient[],
): TariffCoefficient | undefined {
  if (sumOfSides === undefined || !Number.isFinite(sumOfSides)) return undefined;
  return coefficients.find((c) => {
    const min = Number(c.minSum);
    const max = c.maxSum != null ? Number(c.maxSum) : Infinity;
    return sumOfSides >= min && sumOfSides <= max;
  });
}

export interface EffectiveTariff {
  base: number;
  multiplier: number;
  coefCode?: string;
  total: number;
}

/**
 * Итоговый тариф операции: базовая ставка партнёра (или по умолчанию),
 * умноженная на коэффициент К по ШДВ, если операция его использует.
 */
export function calcEffectiveTariff(
  operation: Operation,
  partnerTariff: PartnerTariff | string | undefined,
  sumOfSides: number | undefined,
  coefficients: TariffCoefficient[],
): EffectiveTariff | undefined {
  const baseRaw =
    typeof partnerTariff === 'object'
      ? partnerTariff?.tariff
      : partnerTariff ?? operation.tariff;
  if (baseRaw == null) return undefined;
  const base = Number(baseRaw);
  if (!Number.isFinite(base)) return undefined;

  if (!operation.applySizeCoef) {
    return { base, multiplier: 1, total: base };
  }

  const coef = getSizeCoefficient(sumOfSides, coefficients);
  const multiplier = coef ? Number(coef.multiplier) : 1;
  return {
    base,
    multiplier,
    coefCode: coef && multiplier !== 1 ? coef.code : undefined,
    total: Math.round(base * multiplier * 100) / 100,
  };
}
