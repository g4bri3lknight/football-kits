import ZAI from 'z-ai-web-dev-sdk';

async function analyzeSite() {
  try {
    const zai = await ZAI.create();

    console.log('📖 Leggendo il sito pubblicato...');
    const result = await zai.functions.invoke('page_reader', {
      url: 'https://footballkitsgallery-test.space.z.ai/'
    });

    console.log('\n=== TITOLO ===');
    console.log(result.data.title);

    console.log('\n=== URL ===');
    console.log(result.data.url);

    console.log('\n=== HTML CONTENT ===');
    console.log(result.data.html);

    console.log('\n=== TOKENS USED ===');
    console.log(result.data.usage.tokens);

    return result.data;
  } catch (error) {
    console.error('❌ Errore durante la lettura:', error);
    throw error;
  }
}

analyzeSite();
