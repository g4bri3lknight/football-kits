// Utility per tracciare le visualizzazioni di pagina/dialog

export async function trackPageView(page: string): Promise<void> {
  try {
    await fetch('/api/page-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page }),
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}
