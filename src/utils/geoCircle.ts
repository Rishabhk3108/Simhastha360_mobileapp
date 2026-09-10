// Approximates a real-world circle as a GeoJSON polygon ring. CircleLayer's
// circleRadius is a screen-pixel value (confirmed against the SDK's own
// source, not just its docs), so it would visually shrink/grow with zoom -
// wrong for a zone that must stay pinned to an actual radius on the ground.
// A polygon rendered through FillLayer stays geographically accurate at any
// zoom level instead.
export function circlePolygonLngLat(
  center: { lat: number; lng: number },
  radiusM: number,
  points = 48,
): [number, number][] {
  const R = 6371000;
  const lat0 = (center.lat * Math.PI) / 180;
  const ring: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusM * Math.cos(angle)) / R;
    const dLng = (radiusM * Math.sin(angle)) / (R * Math.cos(lat0));
    const lat = center.lat + (dLat * 180) / Math.PI;
    const lng = center.lng + (dLng * 180) / Math.PI;
    ring.push([lng, lat]);
  }
  return ring;
}
