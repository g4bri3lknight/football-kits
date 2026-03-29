// Verifica se il token admin è valido (stessa logica del login)
export function verifyAuthToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 2) return false;

    const timestamp = parts[0];
    const secret = parts[1];

    // Verifica secret - deve corrispondere esattamente a ADMIN_SECRET
    const validSecret = process.env.ADMIN_SECRET;
    if (!validSecret || secret !== validSecret) {
      return false;
    }

    // Verifica che il token non sia più vecchio di 24 ore
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 ore

    return tokenAge < maxAge;
  } catch {
    return false;
  }
}
