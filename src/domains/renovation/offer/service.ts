import { calculateMaximumOffer } from "./max-offer-engine";
import type { MaxOfferInput, MaxOfferResult } from "./types";

export type OfferService = {
  recommend(input: MaxOfferInput): Promise<MaxOfferResult>;
};

export function createOfferService(): OfferService {
  return {
    async recommend(input) {
      return calculateMaximumOffer(input);
    },
  };
}
