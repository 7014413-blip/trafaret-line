// Tracking page of a parcel number on the carrier's site (Nova Poshta: 14 digits starting
// with 2 or 5; anything else is taken as Ukrposhta).

export function trackingUrl(ttn: string): string {
  const number = ttn.replace(/\s/g, "");
  if (/^[25]\d{13}$/.test(number)) return `https://novaposhta.ua/tracking/?cargo_number=${number}`;
  return `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(number)}`;
}
