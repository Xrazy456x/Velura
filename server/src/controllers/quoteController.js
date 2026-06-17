import { z } from "zod";
import {
  addOnKeys,
  calculateQuote,
  conditionKeys,
  frequencyKeys,
  getPricingMatrix,
  propertyTypeKeys,
  serviceTypeKeys,
  urgencyKeys
} from "../services/pricingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const calculateQuoteSchema = z.object({
  body: z.object({
    serviceType: z.enum(serviceTypeKeys),
    propertyType: z.enum(propertyTypeKeys).default("flat"),
    bedrooms: z.coerce.number().int().min(0).max(5).default(1),
    bathrooms: z.coerce.number().int().min(1).max(8).default(1),
    condition: z.enum(conditionKeys).default("good"),
    urgency: z.enum(urgencyKeys).default("standard"),
    frequency: z.enum(frequencyKeys).default("one_off"),
    addOns: z.array(z.enum(addOnKeys)).default([]),
    carpetRooms: z.coerce.number().int().min(1).max(10).default(1),
    linenSets: z.coerce.number().int().min(1).max(10).default(1),
    addOnAreas: z.coerce.number().int().min(1).max(10).default(1)
  })
});

export const getQuote = asyncHandler(async (req, res) => {
  return res.json({ quote: calculateQuote(req.validated.body) });
});

export const getPricing = asyncHandler(async (req, res) => {
  return res.json({ pricing: getPricingMatrix() });
});
