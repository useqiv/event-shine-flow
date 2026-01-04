import { useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface SlideData {
  title: string;
  content: string[];
}

export const usePitchDeckExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (slides: SlideData[]) => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      slides.forEach((slide, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        // Background
        pdf.setFillColor(15, 15, 20);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        // Header accent line
        pdf.setFillColor(139, 92, 246);
        pdf.rect(margin, margin, 60, 3, "F");

        // Slide number
        pdf.setTextColor(100, 100, 120);
        pdf.setFontSize(10);
        pdf.text(`${index + 1} / ${slides.length}`, pageWidth - margin, pageHeight - 10, { align: "right" });

        // Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(28);
        pdf.setFont("helvetica", "bold");
        pdf.text(slide.title, margin, margin + 20);

        // Content
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 210);

        let yPosition = margin + 40;
        const lineHeight = 8;

        slide.content.forEach((line) => {
          if (yPosition > pageHeight - margin - 20) return;
          
          const splitText = pdf.splitTextToSize(line, contentWidth);
          splitText.forEach((textLine: string) => {
            if (yPosition > pageHeight - margin - 20) return;
            pdf.text(textLine, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 4;
        });

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 120);
        pdf.text("UseQiv - Investor Pitch Deck", margin, pageHeight - 10);
      });

      pdf.save("UseQiv-Investor-Pitch-Deck.pdf");
      toast.success("Pitch deck exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export pitch deck");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPDF, isExporting };
};
