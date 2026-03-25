interface PostcodeResult { lat: number; lng: number; borough: string; }
export async function lookupPostcode(postcode: string): Promise<PostcodeResult> {
  const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`);
  if (!res.ok) throw new Error("Invalid postcode.");
  const data = await res.json();
  if (data.status !== 200 || !data.result) throw new Error("Postcode not found.");
  return { lat: data.result.latitude, lng: data.result.longitude, borough: data.result.admin_district };
}
