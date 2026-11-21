import { randomInt } from "node:crypto";
const A = ["Quiet", "Gentle", "Steady", "Brave", "Calm", "Warm", "Bright", "Kind", "Patient", "Soft", "Open", "Still"];
const B = ["River", "Cloud", "Lantern", "Sparrow", "Maple", "Meadow", "Harbor", "Ember", "Willow", "Breeze", "Pebble", "Dawn"];
export const makeHandle = () => `${A[randomInt(A.length)]}${B[randomInt(B.length)]}${randomInt(10, 99)}`;
