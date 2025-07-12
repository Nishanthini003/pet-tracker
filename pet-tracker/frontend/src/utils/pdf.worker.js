importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js');

self.onmessage = async (event) => {
  try {
    const { arrayBuffer } = event.data;
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n';
      
      // Send progress update
      self.postMessage({ progress: Math.round((i / pdf.numPages) * 100) });
    }
    
    self.postMessage({ text: fullText });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};