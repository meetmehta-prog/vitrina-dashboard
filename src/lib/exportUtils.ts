import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

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

// Campaign Comparison PDF Export

interface CampaignComparisonData {
  campaigns: Array<{
    id: string;
    name: string;
    overview: {
      totalLeads: number;
      totalEmailsSent: number;
      uniqueLeadsEmailed: number;
      emailOpens: number;
      emailOpenRate: number;
      emailClicks: number;
      emailCTR: number;
      emailReplies: number;
      emailReplyRate: number;
      emailBounceRate: number;
      meetingsBooked: number;
    };
    steps: Array<{
      step: string;
      uniqueLeadsSent: number;
      opens: number;
      openRate: number;
      clicks: number;
      ctr: number;
      replies: number;
      replyRate: number;
    }>;
  }>;
}

export function exportComparisonToPDF(data: CampaignComparisonData, filename: string) {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 15;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Campaign Comparison Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Campaign Names
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Campaigns:', 14, yPosition);
  yPosition += 6;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  data.campaigns.forEach((campaign, index) => {
    pdf.text(`${index + 1}. ${campaign.name}`, 20, yPosition);
    yPosition += 5;
  });
  yPosition += 5;

  // Overview Metrics Table
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overview Metrics Comparison', 14, yPosition);
  yPosition += 7;

  const overviewMetrics = [
    ['Total Leads', 'totalLeads', false],
    ['Emails Sent', 'totalEmailsSent', false],
    ['Unique Emailed', 'uniqueLeadsEmailed', false],
    ['Opens', 'emailOpens', false],
    ['Open Rate', 'emailOpenRate', true],
    ['Clicks', 'emailClicks', false],
    ['CTR', 'emailCTR', true],
    ['Replies', 'emailReplies', false],
    ['Reply Rate', 'emailReplyRate', true],
    ['Bounce Rate', 'emailBounceRate', true],
    ['Meetings', 'meetingsBooked', false],
  ];

  const overviewHeaders = ['Metric', ...data.campaigns.map(c => c.name), 'Best Performer'];
  const overviewRows = overviewMetrics.map(([label, key, isPercent]) => {
    const getBestPerformer = () => {
      if (key === 'emailBounceRate') {
        return data.campaigns.reduce((best, current) =>
          current.overview[key as keyof typeof current.overview] < best.overview[key as keyof typeof best.overview] ? current : best
        );
      }
      return data.campaigns.reduce((best, current) =>
        current.overview[key as keyof typeof current.overview] > best.overview[key as keyof typeof best.overview] ? current : best
      );
    };
    const bestCampaign = getBestPerformer();

    return [
      label,
      ...data.campaigns.map(c => {
        const value = c.overview[key as keyof typeof c.overview];
        return `${value.toLocaleString()}${isPercent ? '%' : ''}`;
      }),
      bestCampaign.name
    ];
  });

  autoTable(pdf, {
    startY: yPosition,
    head: [overviewHeaders],
    body: overviewRows,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 }
    },
    margin: { left: 14, right: 14 },
  });

  // Step-by-Step Performance
  const maxSteps = Math.max(...data.campaigns.map(c => c.steps.length));

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex++) {
    // Add new page if needed
    if ((pdf as any).lastAutoTable.finalY > 170) {
      pdf.addPage();
      yPosition = 15;
    } else {
      yPosition = (pdf as any).lastAutoTable.finalY + 10;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Step ${stepIndex + 1} Performance`, 14, yPosition);
    yPosition += 7;

    const stepMetrics = [
      ['Sent', 'uniqueLeadsSent', false],
      ['Opens', 'opens', false],
      ['Open Rate', 'openRate', true],
      ['Clicks', 'clicks', false],
      ['CTR', 'ctr', true],
      ['Replies', 'replies', false],
      ['Reply Rate', 'replyRate', true],
    ];

    const stepHeaders = ['Metric', ...data.campaigns.map(c => c.name), 'Best Performer'];
    const stepRows = stepMetrics.map(([label, key, isPercent]) => {
      const validCampaigns = data.campaigns.filter(c => c.steps[stepIndex]);

      if (validCampaigns.length === 0) {
        return [label, ...data.campaigns.map(() => 'N/A'), 'N/A'];
      }

      const bestCampaign = validCampaigns.reduce((best, current) => {
        const bestValue = best.steps[stepIndex][key as keyof typeof best.steps[0]] || 0;
        const currentValue = current.steps[stepIndex][key as keyof typeof current.steps[0]] || 0;
        return currentValue > bestValue ? current : best;
      });

      return [
        label,
        ...data.campaigns.map(c => {
          const step = c.steps[stepIndex];
          if (!step) return 'N/A';
          const value = step[key as keyof typeof step] || 0;
          return `${(typeof value === 'number' ? value : parseFloat(value.toString())).toLocaleString()}${isPercent ? '%' : ''}`;
        }),
        bestCampaign.name
      ];
    });

    autoTable(pdf, {
      startY: yPosition,
      head: [stepHeaders],
      body: stepRows,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 }
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Add footer to each page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}
