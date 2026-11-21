import { z } from "zod";

export const email = z.string().trim().toLowerCase().email().max(200);
export const password = z.string().min(10, "Use at least 10 characters").max(200)
  .refine((p) => !/^(password|12345678|qwerty|letmein|iloveyou|udaan)/i.test(p), "That password is too easy to guess");
export const uuid = z.string().uuid();
export const lang = z.enum(["en", "hi", "mr", "gu"]);
export const text = (max = 4000) => z.string().trim().min(1).max(max);
export const optText = (max = 4000) => z.string().trim().max(max).optional().nullable();
export const rating = z.number().int().min(1).max(5);
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
