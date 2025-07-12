export const exportToCsv = (filename: string, data: any[]) => {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }
  
    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = headers.map(header => {
        // Handle nested objects and arrays
        const value = item[header];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += row.join(',') + '\n';
    });
  
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };