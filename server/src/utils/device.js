export function getDeviceType(ua=''){
  const s=ua.toLowerCase();
  if(/tablet|ipad|android(?!.*mobile)/.test(s)) return 'Tablet';
  if(/mobile|iphone|ipod|android/.test(s)) return 'Mobile';
  return 'Desktop';
}
