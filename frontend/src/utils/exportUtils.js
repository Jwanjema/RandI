// Export utilities for Excel, CSV, and PDF

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) value = '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"`;
        }
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data, filename = 'export.xlsx') => {
  // For a full Excel export, you would need a library like xlsx or exceljs
  // For now, we'll export as CSV with .xlsx extension (Excel can open CSV files)
  exportToCSV(data, filename.replace('.xlsx', '.csv'));
  
  console.log('Note: For true Excel format (.xlsx), install "xlsx" package: npm install xlsx');
};

export const exportTableToCSV = (tableId, filename = 'table-export.csv') => {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error('Table not found');
    return;
  }

  let csv = [];
  const rows = table.querySelectorAll('tr');
  
  for (let i = 0; i < rows.length; i++) {
    const row = [];
    const cols = rows[i].querySelectorAll('td, th');
    
    for (let j = 0; j < cols.length; j++) {
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, '""');
      if (data.includes(',')) {
        data = `"${data}"`;
      }
      row.push(data);
    }
    csv.push(row.join(','));
  }

  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printPage = () => {
  window.print();
};

export const generatePDFReport = async (element, filename = 'report.pdf') => {
  // This would require a library like jsPDF or html2pdf
  console.log('PDF generation requires jsPDF or html2pdf library');
  console.log('Install with: npm install jspdf html2canvas');
  
  // For now, use browser print to PDF
  alert('Please use Print (Ctrl+P) and select "Save as PDF" as your printer');
  window.print();
};

// Format data for export
export const formatDataForExport = (data, columns) => {
  return data.map(item => {
    const formatted = {};
    columns.forEach(col => {
      formatted[col.header] = col.accessor ? col.accessor(item) : item[col.key];
    });
    return formatted;
  });
};

// Export with custom formatting
export const exportWithFormatting = (data, columns, filename) => {
  const formattedData = formatDataForExport(data, columns);
  exportToCSV(formattedData, filename);
};
