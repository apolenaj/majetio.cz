/**
 * Engine percentage DTO — always a ratio string (5.4% → "0.054").
 */

import { z } from "zod";

import { Percentage } from "@/domains/finance";

export const percentageRatioDtoSchema = z.object({
  /** Ratio as decimal string, e.g. "0.054" for 5.4 %. */
  ratio: z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, "ratio must be a decimal string"),
});

export type PercentageRatioDto = z.infer<typeof percentageRatioDtoSchema>;

export const percentageRatioDtoOrNullSchema =
  percentageRatioDtoSchema.nullable();

export function percentageToDto(value: Percentage): PercentageRatioDto {
  return { ratio: value.toRatio().toString() };
}

export function percentageFromDto(dto: PercentageRatioDto): Percentage {
  return Percentage.fromRatio(dto.ratio);
}

export function percentageFromDtoOrNull(
  dto: PercentageRatioDto | null | undefined,
): Percentage | null {
  if (dto == null) return null;
  return percentageFromDto(percentageRatioDtoSchema.parse(dto));
}

/**
 * Accept UI percent-points input and normalize to ratio DTO.
 * Does not keep percent-points as the canonical engine value.
 */
export const percentPointsInputSchema = z
  .number()
  .finite()
  .transform((points) => percentageToDto(Percentage.fromPercentPoints(points)));
