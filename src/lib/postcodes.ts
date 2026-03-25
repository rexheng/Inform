import { PostcodeResult } from "./types";

export async function lookupPostcode(postcode: string): Promise<PostcodeResult> {
  const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`);

  if (!res.ok) {
    throw new Error("Invalid postcode. Please check and try again.");
  }

  const data = await res.json();

  if (data.status !== 200 || !data.result) {
    throw new Error("Postcode not found. Please enter a valid London postcode.");
  }

  const { latitude, longitude, admin_district } = data.result;

  return {
    lat: latitude,
    lng: longitude,
    borough: admin_district,
  };
}
