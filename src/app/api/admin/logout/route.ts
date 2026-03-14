import { NextResponse } from 'next/server';

// POST /api/admin/logout - Logout admin
export async function POST() {
  // Con localStorage, il logout viene gestito lato client
  // Questa API è mantenuta per compatibilità
  return NextResponse.json({ success: true, message: 'Logout effettuato con successo' });
}
