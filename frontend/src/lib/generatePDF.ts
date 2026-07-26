import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateProfessionalPDF = (report: any, user: any) => {
  const doc = new jsPDF();
  
  // Custom Header (Dark Blue)
  doc.setFillColor(30, 58, 138); // Tailwind blue-900
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("LUMIFY", 14, 23);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("ASSESSMENT REPORT", 100, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${report.id.substring(0, 8).toUpperCase()}`, 165, 22);
  
  // Candidate Details Section
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CANDIDATE PROFILE", 14, 50);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  autoTable(doc, {
    startY: 55,
    head: [],
    body: [
      ['Name', user?.name || 'Candidate', 'Target Role', report.role || 'Unspecified'],
      ['Email', user?.email || 'Not provided', 'Date', new Date(report.generatedAt).toLocaleDateString()],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, textColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25, textColor: [15, 23, 42] },
      1: { cellWidth: 70 },
      2: { fontStyle: 'bold', cellWidth: 25, textColor: [15, 23, 42] },
      3: { cellWidth: 70 }
    }
  });

  const finalYDetails = (doc as any).lastAutoTable.finalY + 15;
  
  // Overall Score Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OVERALL PERFORMANCE", 14, finalYDetails);
  
  const maxMarks = (report.totalQuestions || 5) * 5;
  const earnedMarks = report.questions ? report.questions.reduce((acc: number, q: any) => acc + (q.score || 0), 0) : 0;
  const percentage = (earnedMarks / maxMarks) * 100;
  
  // Draw a box for score
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, finalYDetails + 5, 182, 25, 3, 3, 'FD');
  
  doc.setFontSize(16);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(`Score: ${earnedMarks} / ${maxMarks}`, 20, finalYDetails + 16);
  
  let grade = "Needs Improvement";
  if (percentage >= 80) grade = "Excellent";
  else if (percentage >= 60) grade = "Good";
  else if (percentage >= 40) grade = "Average";
  
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // slate-500
  doc.text(`Percentile Equivalence: ~${Math.round(percentage)}%`, 20, finalYDetails + 24);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Grade: ${grade}`, 140, finalYDetails + 20);
  
  // Skill Analysis
  let yCursor = finalYDetails + 45;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("COMPETENCY ANALYSIS", 14, yCursor);
  
  autoTable(doc, {
    startY: yCursor + 5,
    head: [['Competency Area', 'Score (Out of 100)', 'Proficiency Level']],
    body: [
      ['Technical Skills', `${report.technicalScore || 0}`, (report.technicalScore || 0) > 60 ? 'Proficient' : 'Developing'],
      ['Communication', `${report.communicationScore || 0}`, (report.communicationScore || 0) > 60 ? 'Proficient' : 'Developing'],
      ['Confidence & Delivery', `${report.confidenceScore || 0}`, (report.confidenceScore || 0) > 60 ? 'Proficient' : 'Developing'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 10 }
  });
  
  yCursor = (doc as any).lastAutoTable.finalY + 15;
  
  if (yCursor > 230) {
    doc.addPage();
    yCursor = 20;
  }
  
  // Strengths & Weaknesses
  autoTable(doc, {
    startY: yCursor,
    head: [['Key Strengths', 'Areas for Improvement']],
    body: [
      [
        (report.strengths && report.strengths.length > 0) ? '• ' + report.strengths.join('\n\n• ') : 'No notable strengths identified.',
        (report.weaknesses && report.weaknesses.length > 0) ? '• ' + report.weaknesses.join('\n\n• ') : 'No areas for improvement identified.'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { cellPadding: 6, fontSize: 10, valign: 'top', textColor: [51, 65, 85], lineColor: [226, 232, 240] },
    columnStyles: {
      0: { cellWidth: 91 },
      1: { cellWidth: 91 }
    }
  });
  
  yCursor = (doc as any).lastAutoTable.finalY + 15;
  
  if (yCursor > 230) {
    doc.addPage();
    yCursor = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("EXAMINER'S SUMMARY", 14, yCursor);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const splitFeedback = doc.splitTextToSize(report.detailedSummary || report.feedback || "No detailed feedback available.", 182);
  doc.text(splitFeedback, 14, yCursor + 8);
  
  // Detailed Questions Section
  if (report.questions && report.questions.length > 0) {
    doc.addPage();
    let qY = 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("DETAILED QUESTION EVALUATION", 14, qY);
    qY += 15;

    report.questions.forEach((q: any, i: number) => {
      // Basic page break logic
      if (qY > 250) {
        doc.addPage();
        qY = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      const qText = doc.splitTextToSize(`Q${i + 1}. ${q.questionText}`, 150); // leave room for score
      doc.text(qText, 14, qY);
      
      // Score Badge
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      const isGood = q.score >= 4;
      doc.setFillColor(isGood ? 16 : 220, isGood ? 185 : 38, isGood ? 129 : 38); 
      doc.roundedRect(170, qY - 4, 25, 6, 2, 2, 'F');
      doc.text(`Score: ${q.score}/5`, 173, qY + 0.5);
      
      qY += (qText.length * 5) + 3;
      
      // User Answer
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Candidate's Response:", 14, qY);
      qY += 5;
      
      doc.setFont("helvetica", "italic");
      doc.setTextColor(71, 85, 105);
      const aText = doc.splitTextToSize(`"${q.answerText || 'No answer provided.'}"`, 180);
      doc.text(aText, 16, qY);
      qY += (aText.length * 5) + 4;
      
      // AI Feedback
      if (q.feedback) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("AI Feedback:", 14, qY);
        qY += 5;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const fText = doc.splitTextToSize(q.feedback, 180);
        doc.text(fText, 16, qY);
        qY += (fText.length * 5) + 8;
      } else {
        qY += 4;
      }
    });
  }
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Strictly Confidential • Generated by Assessment Engine • Page ${i} of ${pageCount}`, 14, 290);
  }
  
  doc.save(`Assessment_Result_${report.role?.replace(/[^a-z0-9]/gi, '_') || 'Report'}.pdf`);
};
