import { Message, Sender } from '../types';

declare global {
  interface Window {
    jspdf: any;
  }
}

export const generateChatPDF = (title: string, messages: Message[]) => {
  if (!window.jspdf) {
    alert("PDF library not loaded.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const pageHeight = doc.internal.pageSize.height;
  let y = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(111, 76, 255); // Primary color
  doc.text("CRAB", 10, y);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Chat: ${title}`, 10, y + 8);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, y + 14);
  doc.line(10, y + 18, 200, y + 18);
  
  y += 30;

  // Content
  doc.setFontSize(10);
  
  messages.forEach((msg) => {
    // Check page break
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    const isUser = msg.sender === Sender.USER;
    const prefix = isUser ? "User: " : "CRAB: ";
    const textLines = doc.splitTextToSize(prefix + msg.text, 180);

    if (isUser) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
    } else {
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
    }

    doc.text(textLines, 10, y);
    y += (textLines.length * 5) + 5;
  });

  doc.save(`${title.replace(/\s+/g, '_')}_Transcript.pdf`);
};