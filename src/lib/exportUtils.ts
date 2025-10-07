import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// CSV Export Functions

export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that contain commas or quotes
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// PDF Export Functions

export async function exportChartsToPDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      alert('Element not found');
      return;
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF. Please try again.');
  }
}

export async function exportDashboardToPDF(filename: string) {
  try {
    const dashboard = document.querySelector('.dashboard-container') as HTMLElement;
    if (!dashboard) {
      alert('Dashboard not found');
      return;
    }

    const canvas = await html2canvas(dashboard, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: dashboard.scrollWidth,
      windowHeight: dashboard.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF. Please try again.');
  }
}

// Table Data Export

export function exportTableToCSV(tableId: string, filename: string) {
  const table = document.getElementById(tableId) as HTMLTableElement;
  if (!table) {
    alert('Table not found');
    return;
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  const csvData: string[][] = [];

  rows.forEach(row => {
    const cols = Array.from(row.querySelectorAll('td, th'));
    const rowData = cols.map(col => col.textContent || '');
    csvData.push(rowData);
  });

  const csvContent = csvData.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Campaign Data Formatters

export function formatCampaignOverviewForCSV(data: any) {
  return [{
    'Total Leads': data.totalLeads,
    'Emails Sent': data.totalEmailsSent,
    'Unique Emailed': data.uniqueLeadsEmailed,
    'Opens': data.emailOpens,
    'Open Rate %': data.emailOpenRate,
    'Clicks': data.emailClicks,
    'CTR %': data.emailCTR,
    'Replies': data.emailReplies,
    'Reply Rate %': data.emailReplyRate,
    'Bounce Rate %': data.emailBounceRate,
    'Meetings': data.meetingsBooked,
  }];
}

export function formatStepPerformanceForCSV(steps: any[]) {
  return steps.map(step => ({
    'Step': step.step,
    'Sent': step.sent,
    'Opens': step.opens,
    'Open Rate %': step.openRate,
    'Clicks': step.clicks,
    'CTR %': step.ctr,
    'Replies': step.replies,
    'Reply Rate %': step.replyRate,
  }));
}

export function formatTimelineForCSV(timeline: any[]) {
  return timeline.map(item => ({
    'Date': new Date(item.date).toLocaleDateString(),
    'First Replies': item.firstReplies,
    'Repeat Replies': item.repeatReplies,
    'Total Replies': item.firstReplies + item.repeatReplies,
  }));
}
