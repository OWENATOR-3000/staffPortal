// app/api/requests/download/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib'; // Removed StandardFonts
import JSZip from 'jszip';
import { RowDataPacket } from 'mysql2';
import fontkit from '@pdf-lib/fontkit'; // This is now required again

// Define specific interfaces for each request type's details
// Each one MUST extend RowDataPacket to be compatible with db.query
interface LeaveDetails extends RowDataPacket {
    start_date: string;
    end_date: string;
    reason_type: string;
    reason_details?: string;
    number_of_hours: number;
    supervisor_name: string;
    employee_signature_name: string;
    comments: string;
    document_id?: number;
}

interface SalaryAdvanceDetails extends RowDataPacket {
    amount_requested: number;
    requested_repayment_date: string;
    reason: string;
    supervisor_signature_date?: string;
}

interface ComplaintDetails extends RowDataPacket {
    incident_date: string;
    incident_time: string;
    location: string;
    complaint_nature: "Harassment" | "Unfair Treatment" | "Workplace Safety" | "Other";
    complaint_nature_other?: string;
    description: string;
    desired_resolution: string;
    acknowledgment: number;
}

interface OvertimeDetails extends RowDataPacket {
    overtime_date: string;
    overtime_type: "Normal" | "Sunday";
    hours_worked: number;
    reason: string;
}

interface LoanDetails extends RowDataPacket {
    amount_requested: number;
    loan_type: string;
    proposed_repayment_terms: string;
    reason: string;
    employee_signature_name: string;
}

// Discriminated Union: This defines the possible structures for the request
type RequestDetails = 
    | { requestable_type: 'Leave', details: LeaveDetails }
    | { requestable_type: 'Salary Advance', details: SalaryAdvanceDetails }
    | { requestable_type: 'Complaint', details: ComplaintDetails }
    | { requestable_type: 'Overtime', details: OvertimeDetails }
    | { requestable_type: 'Loan', details: LoanDetails };
    
// The new, fully-typed FullRequest.
type FullRequest = RowDataPacket & {
    id: number;
    staff_name: string;
    staff_department: string;
    staff_contact_number: string;
    created_at: string;
} & RequestDetails;

// Fetches all necessary details for a request from the database - UNCHANGED
async function getFullRequestDetails(requestId: string): Promise<FullRequest | null> {
    const [requestData] = await db.query<RowDataPacket[]>(
     `SELECT req.*, s.full_name as staff_name, s.email as staff_email, s.department as staff_department, s.primary_phone_number as staff_contact_number FROM requests req JOIN staff s ON req.staff_id = s.id WHERE req.id = ?`,
     [requestId]
 );
 const baseRequest = requestData[0];
 if (!baseRequest) return null;

 const commonProps = {
    id: baseRequest.id,
    staff_name: baseRequest.staff_name,
    staff_department: baseRequest.staff_department,
    staff_contact_number: baseRequest.staff_contact_number,
    created_at: baseRequest.created_at,
 };

 // Now, we use the specific interfaces which extend RowDataPacket
 if (baseRequest.requestable_type === 'Leave') {
     const [details] = await db.query<LeaveDetails[]>('SELECT * FROM leave_requests WHERE id = ?', [baseRequest.requestable_id]);
     if (details[0]) return { ...commonProps, requestable_type: 'Leave', details: details[0] } as FullRequest;
 } 
 else if (baseRequest.requestable_type === 'Salary Advance') { 
     const [details] = await db.query<SalaryAdvanceDetails[]>('SELECT * FROM salary_advance_requests WHERE id = ?', [baseRequest.requestable_id]);
     if (details[0]) return { ...commonProps, requestable_type: 'Salary Advance', details: details[0] } as FullRequest;
 }
 else if (baseRequest.requestable_type === 'Complaint') {
     const [details] = await db.query<ComplaintDetails[]>('SELECT * FROM complaints WHERE id = ?', [baseRequest.requestable_id]);
     if (details[0]) return { ...commonProps, requestable_type: 'Complaint', details: details[0] } as FullRequest;
 }
 else if (baseRequest.requestable_type === 'Overtime') {
    const [details] = await db.query<OvertimeDetails[]>('SELECT * FROM overtime_requests WHERE id = ?', [baseRequest.requestable_id]);
    if (details[0]) return { ...commonProps, requestable_type: 'Overtime', details: details[0] } as FullRequest;
 }
 else if (baseRequest.requestable_type === 'Loan') {
    const [details] = await db.query<LoanDetails[]>('SELECT * FROM loan_requests WHERE id = ?', [baseRequest.requestable_id]);
    if (details[0]) return { ...commonProps, requestable_type: 'Loan', details: details[0] } as FullRequest;
 }
 
 return null; // Fallback if details aren't found
}


// ====================================================================================
// CORRECTED PDF GENERATION FUNCTION
// Uses custom embedded fonts to support special characters like '✔'
// ====================================================================================
async function generateStructuredLeaveFormPdf(requestData: FullRequest): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    // Register fontkit to handle custom fonts
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.27, 841.89]); // A4 page size
    const { width, height } = page.getSize();
    const black = rgb(0, 0, 0);

    // --- Load and Embed Custom Fonts ---
    // This is the fix: use a font file that contains the '✔' glyph.
    const fontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans.ttf');
    const boldFontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans-Bold.ttf');

    const fontBytes = await readFile(fontPath);
    const boldFontBytes = await readFile(boldFontPath);
    
    const customFont = await pdfDoc.embedFont(fontBytes);
    const customBoldFont = await pdfDoc.embedFont(boldFontBytes);


    // === Header and Logo ===
    const logoPath = path.join(process.cwd(), 'public', 'GMLogo.png');
    try {
        const logoImageBytes = await readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoImageBytes);
        page.drawImage(logoImage, {
            x: 230,
            y: height - 80,
            width: 130,
            height: 60,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
        console.warn(`Could not load logo from ${logoPath}. Skipping logo.`);
    }

    const title = 'Employee Leave Request Form';
    const titleWidth = customBoldFont.widthOfTextAtSize(title, 16);
    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 110,
        font: customBoldFont,
        size: 16,
        color: black,
    });

    let y = height - 140;

    // === Employee Info Section (using custom fonts) ===
    page.drawText('Employee Name:', { x: 50, y, font: customFont, size: 12 });
    page.drawText(requestData.staff_name, { x: 162, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 160, y: y - 2 }, end: { x: 500, y: y - 2 }, thickness: 0.5 });

    y -= 25;
    const requestDate = new Date(requestData.created_at).toLocaleDateString('en-CA');
    page.drawText('Date:', { x: 50, y, font: customFont, size: 12 });
    page.drawText(requestDate, { x: 162, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 160, y: y - 2 }, end: { x: 300, y: y - 2 }, thickness: 0.5 });

    y -= 25;
    page.drawText('Supervisor Name:', { x: 50, y, font: customFont, size: 12 });
    page.drawText(requestData.details.supervisor_name, { x: 162, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 160, y: y - 2 }, end: { x: 500, y: y - 2 }, thickness: 0.5 });

    // === Reason Section ===
    y -= 40;
    page.drawText('REASON FOR LEAVE', { x: 50, y, font: customBoldFont, size: 12 });
    
    y -= 20;
    const checkboxSize = 10;
    const reasons = [ "Vacation", "Leave of Absence", "Sick - Family", "Sick - Self", "Dr. Appointment", "Sick Family", "Funeral For", "Other" ];
    const positions = [
        { x: 50,  y: y },       { x: 180, y: y },       { x: 330, y: y },
        { x: 50,  y: y - 20 },  { x: 180, y: y - 20 },
        { x: 50,  y: y - 40 },  { x: 50,  y: y - 60 },  { x: 50,  y: y - 80 },
    ];

    reasons.forEach((label, index) => {
        const { x, y: y_pos } = positions[index];
        const isChecked = requestData.details.reason_type === label;
        
        page.drawRectangle({ x, y: y_pos, width: checkboxSize, height: checkboxSize, borderWidth: 0.5, borderColor: black });
        if (isChecked) {
            // This will now work correctly because customBoldFont supports the '✔' glyph
            page.drawText('✔', { x: x + 1, y: y_pos - 1, font: customBoldFont, size: 12, color: black });
        }
        page.drawText(label, { x: x + 15, y: y_pos, font: customFont, size: 12 });

        if (label === "Sick Family" || label === "Funeral For" || label === "Other") {
            page.drawLine({ start: { x: x + 100, y: y_pos + 2 }, end: { x: 500, y: y_pos + 2 }, thickness: 0.5 });
            if (isChecked && requestData.details.reason_details) {
                page.drawText(requestData.details.reason_details, { x: x + 102, y: y_pos, font: customBoldFont, size: 10 });
            }
        }
    });

    // ... The rest of the function remains the same, but will now use customFont and customBoldFont
    // === Leave Requested Section ===
    y = y - 100;
    page.drawText('LEAVE REQUESTED', { x: 50, y, font: customBoldFont, size: 12 });
      
    y -= 20;
    page.drawText('From:', { x: 50, y, font: customFont, size: 12 });
    page.drawText(new Date(requestData.details.start_date).toLocaleDateString('en-CA'), { x: 102, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 100, y: y - 2 }, end: { x: 200, y: y - 2 }, thickness: 0.5 });
    page.drawText('To:', { x: 250, y, font: customFont, size: 12 });
    page.drawText(new Date(requestData.details.end_date).toLocaleDateString('en-CA'), { x: 282, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 280, y: y - 2 }, end: { x: 380, y: y - 2 }, thickness: 0.5 });
      
    y -= 25;
    const diffTime = Math.abs(new Date(requestData.details.end_date).getTime() - new Date(requestData.details.start_date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    page.drawText('Number of Hours:', { x: 50, y, font: customFont, size: 12 });
    page.drawText(String(requestData.details.number_of_hours), { x: 162, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 160, y: y - 2 }, end: { x: 260, y: y - 2 }, thickness: 0.5 });
    page.drawText('Number of Days:', { x: 300, y, font: customFont, size: 12 });
    page.drawText(String(diffDays), { x: 412, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 410, y: y - 2 }, end: { x: 500, y: y - 2 }, thickness: 0.5 });

    // === Signatures Section ===
    y -= 40;
    page.drawText('Employee Signature:', { x: 50, y, font: customFont, size: 12 });
    page.drawText(requestData.details.employee_signature_name || 'Digitally Signed', { x: 182, y, font: customBoldFont, size: 11, color: rgb(0.2, 0.2, 0.2) });
    page.drawLine({ start: { x: 180, y: y - 2 }, end: { x: 300, y: y - 2 }, thickness: 0.5 });
    page.drawText('Date:', { x: 350, y, font: customFont, size: 12 });
    page.drawText(requestDate, { x: 392, y, font: customBoldFont, size: 12 });
    page.drawLine({ start: { x: 390, y: y - 2 }, end: { x: 500, y: y - 2 }, thickness: 0.5 });

    y -= 25;
    page.drawText('Supervisor Signature:', { x: 50, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: 180, y: y - 2 }, end: { x: 300, y: y - 2 }, thickness: 0.5 });
    page.drawText('Date:', { x: 350, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: 390, y: y - 2 }, end: { x: 500, y: y - 2 }, thickness: 0.5 });

    // === Comments Section ===
    y -= 40;
    page.drawText('Comment(s):', { x: 50, y, font: customFont, size: 12 });
    const commentY = y - 13;
    y -= 15;
    for (let i = 0; i < 3; i++) {
        page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 0.5 });
        y -= 15;
    }
    if(requestData.details.comments) {
        page.drawText(requestData.details.comments, { x: 55, y: commentY, font: customBoldFont, size: 10, lineHeight: 12, color: rgb(0.1, 0.1, 0.1) });
    }

    return await pdfDoc.save();
}

// Main API Route Handler - UNCHANGED
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSessionUser();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const resolvedParams = await params;
        const requestData = await getFullRequestDetails(resolvedParams.id);
        
        if (!requestData?.details) {
            return new NextResponse('Request details not found.', { status: 404 });
        }
        
        let pdfBytes: Uint8Array;
        let formFileName: string;

        if (requestData.requestable_type === 'Leave') {
            pdfBytes = await generateStructuredLeaveFormPdf(requestData); 
            formFileName = `Leave_Request_${requestData.id}_${requestData.staff_name.replace(/ /g, '_')}.pdf`;
        } 
        // START NEW CODE
       else if (requestData.requestable_type === 'Salary Advance') {
    
    const salaryAdvanceData: SalaryAdvanceRequestData = {
        employee_name: requestData.staff_name,
        request_date: requestData.created_at, 
        
        // ==================== FIX IS HERE ====================
        // Explicitly convert the string from the DB to a Number.
        advance_amount: Number(requestData.details.amount_requested) || 0, 
        // ======================================================

        payment_date: requestData.details.requested_repayment_date, 
        reason: requestData.details.reason, 
        employee_signature_name: requestData.staff_name, 
        supervisor_signature_name: requestData.details.supervisor_name,
        supervisor_signature_date: requestData.details.supervisor_signature_date
    };

    pdfBytes = await generateSalaryAdvancePdf(salaryAdvanceData);
    formFileName = `Salary_Advance_${requestData.id}_${requestData.staff_name.replace(/ /g, '_')}.pdf`;
}
else if (requestData.requestable_type === 'Complaint') {
    // Map your database details to the ComplaintFormData interface
  const complaintData: ComplaintFormData = {
        full_name: requestData.staff_name,
        department: requestData.staff_department || 'N/A',
        contact_number: requestData.staff_contact_number || 'N/A',
        
        // Correcting all complaint-specific fields
        date_of_incident: requestData.details.incident_date, 
        time_of_incident: requestData.details.incident_time || 'N/A', 
        location: requestData.details.location || 'N/A',
        nature_of_complaint: requestData.details.complaint_nature,
        
        // This handles the "Other" text field
        complaint_nature_other: requestData.details.complaint_nature_other || '',

        // These fields were causing the last errors
        description: requestData.details.description || '',
        resolution: requestData.details.desired_resolution || '',
        
        // Correcting the acknowledgment field
        is_acknowledged: requestData.details.acknowledgment === 1,
    };
    // =========================================================================

    pdfBytes = await generateComplaintFormPdf(complaintData);
    formFileName = `Complaint_Form_${requestData.id}_${requestData.staff_name.replace(/ /g, '_')}.pdf`;
}


else if (requestData.requestable_type === 'Overtime') {
    // Map the database data to the OvertimeRequestData interface
    // **CHECK YOUR DATABASE FOR THE CORRECT COLUMN NAMES**

        const rawOvertimeType: string = requestData.details.overtime_type; 
    let fullOvertimeText: 'Normal (1.5x Rate)' | 'Sunday (2.0x Rate)';

    if (rawOvertimeType === 'Normal') {
        fullOvertimeText = 'Normal (1.5x Rate)';
    } else if (rawOvertimeType === 'Sunday') {
        fullOvertimeText = 'Sunday (2.0x Rate)';
    } else {
        // A safe fallback in case the data is unexpected
        fullOvertimeText = 'Normal (1.5x Rate)'; 
    }

    const overtimeData: OvertimeRequestData = {
        employee_name: requestData.staff_name,
        department: requestData.staff_department || 'N/A',
        request_date: requestData.created_at,
        date_of_overtime: requestData.details.overtime_date, // e.g., 'overtime_date'
       type_of_overtime: fullOvertimeText, // e.g., 'overtime_type'
        hours_worked: Number(requestData.details.hours_worked) || 0,     // e.g., 'hours'
        reason: requestData.details.reason || '',
    };

    pdfBytes = await generateOvertimeRequestPdf(overtimeData);
    formFileName = `Overtime_Request_${requestData.id}_${requestData.staff_name.replace(/ /g, '_')}.pdf`;
}

else if (requestData.requestable_type === 'Loan') {
    // Map the database data to the LoanRequestData interface
    const loanData: LoanRequestData = {
        employee_name: requestData.staff_name,
        department: requestData.staff_department || 'N/A',
        request_date: requestData.created_at,
        
        // Using the exact column names from your DB schema image
        loan_amount: Number(requestData.details.amount_requested) || 0,
        loan_type: requestData.details.loan_type || 'N/A',
        reason: requestData.details.reason || '',
        repayment_terms: requestData.details.proposed_repayment_terms || '',
        employee_signature_name: requestData.details.employee_signature_name || '',
    };

    pdfBytes = await generateLoanRequestPdf(loanData);
    formFileName = `Loan_Request_${requestData.id}_${requestData.staff_name.replace(/ /g, '_')}.pdf`;
}
        // END NEW CODE
        else {
            // This is now the final fallback for unsupported types
             return assertNever(requestData);
        }
        function assertNever(value: never): never {
    throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

    

        const zip = new JSZip();
        zip.file(formFileName, pdfBytes);
        
        if (requestData.details.document_id) {
            const [docs] = await db.query<RowDataPacket[]>('SELECT file_path, file_name FROM documents WHERE id = ?', [requestData.details.document_id]);
            if (docs.length > 0) {
                try {
                    const attachmentBytes = await readFile(docs[0].file_path);
                    zip.file(`Attachment_${docs[0].file_name}`, attachmentBytes);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (_e) {
                    console.warn(`Attachment file not found at path: ${docs[0].file_path}`);
                }
            }
        }
        
     const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
     const arrayBuffer = new Uint8Array(zipBuffer).buffer;
        const headers = new Headers();
        const zipFileName = `Request_Package_${requestData.id}.zip`;
        headers.append('Content-Disposition', `attachment; filename="${zipFileName}"`);
        headers.append('Content-Type', 'application/zip');
        
        return new NextResponse(new Blob([arrayBuffer]), { status: 200, headers });

        
    } catch (error) {
        console.error('Download Package Error:', error);
        return new NextResponse('Failed to generate download package.', { status: 500 });
    }
}

interface SalaryAdvanceRequestData {
    employee_name: string;
    request_date: string;
    advance_amount: number;
    payment_date: string;
    reason: string;
    employee_signature_name: string;
    supervisor_signature_name?: string;
    supervisor_signature_date?: string;
}

export async function generateSalaryAdvancePdf(data: SalaryAdvanceRequestData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.27, 841.89]); // A4
    const { width, height } = page.getSize();
   

    // --- Load and Embed Custom Fonts ---
    const fontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans.ttf');
    const boldFontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans-Bold.ttf');
    const fontBytes = await readFile(fontPath);
    const boldFontBytes = await readFile(boldFontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const customBoldFont = await pdfDoc.embedFont(boldFontBytes);

    // --- Header ---
    const logoPath = path.join(process.cwd(), 'public', 'GMLogo.png'); // Assuming same logo
    try {
        const logoImageBytes = await readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoImageBytes);
        const logoDims = logoImage.scale(0.05); // Scale down for this form
        page.drawImage(logoImage, {
            x: (width / 2) - (logoDims.width / 2),
            y: height - 120,
            width: logoDims.width,
            height: logoDims.height,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
        console.warn(`Could not load logo from ${logoPath}. Skipping logo.`);
    }

    const title = 'Request for Advance on Salary';
    const titleWidth = customBoldFont.widthOfTextAtSize(title, 22);
    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 160,
        font: customBoldFont,
        size: 22,
        
    });
    
    let y = height - 220;
    const leftMargin = 70;
    const fieldWidth = 250;

    // --- Employee Info ---
    page.drawText('Employee Name:', { x: leftMargin, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: leftMargin + 105, y: y - 2 }, end: { x: leftMargin + fieldWidth, y: y - 2 }, thickness: 0.5 });
    page.drawText(data.employee_name, { x: leftMargin + 107, y, font: customBoldFont, size: 12 });

    page.drawText('Date:', { x: width - 200, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: width - 165, y: y - 2 }, end: { x: width - 70, y: y - 2 }, thickness: 0.5 });
    page.drawText(new Date(data.request_date).toLocaleDateString('en-CA'), { x: width - 163, y, font: customBoldFont, size: 12 });
    
    // --- Request Body ---
    y -= 50;
    // This part is drawn in segments to allow for data insertion.
    page.drawText('I,', { x: leftMargin, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: leftMargin + 18, y: y - 2 }, end: { x: leftMargin + 200, y: y - 2 }, thickness: 0.5 });
    page.drawText(data.employee_name, { x: leftMargin + 20, y, font: customBoldFont, size: 12 });
page.drawText(', request an advance payment of', { x: leftMargin + 205, y, font: customFont, size: 12 });
// We moved the line and the amount to the right to create space after "of"
page.drawLine({ start: { x: leftMargin + 410, y: y - 2 }, end: { x: leftMargin + 480, y: y - 2 }, thickness: 0.5 });
const formattedAmount = `$ ${data.advance_amount.toFixed(2)}`;
page.drawText(formattedAmount, { x: leftMargin + 412, y, font: customBoldFont, size: 12 });
    
    y -= 25;
    page.drawText('on my salary to be paid on', { x: leftMargin, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: leftMargin + 175, y: y - 2 }, end: { x: leftMargin + 285, y: y - 2 }, thickness: 0.5 });
    page.drawText(new Date(data.payment_date).toLocaleDateString('en-CA'), { x: leftMargin + 177, y, font: customBoldFont, size: 12 });
    page.drawText('as permitted by company policy.', { x: leftMargin + 290, y, font: customFont, size: 12 });

    // --- Reason Section ---
    y -= 50;
    page.drawText('Reason:', { x: leftMargin, y, font: customFont, size: 12 });
    const reasonY = y;
    for (let i = 0; i < 2; i++) {
        page.drawLine({ start: { x: leftMargin, y: y - 17 - (i * 20) }, end: { x: width - leftMargin, y: y - 17 - (i * 20) }, thickness: 0.5 });
    }
    page.drawText(data.reason, { x: leftMargin + 2, y: reasonY - 15, font: customBoldFont, size: 11, lineHeight: 14 });

    // --- Agreement Section ---
    y -= 100;
    page.drawText('I agree to repay this advance as follows:', { x: leftMargin, y, font: customFont, size: 12 });
    
    y -= 30;
    const agreementText = [
        'A lump-sum payroll deduction to be made from my salary on the first pay period',
        'immediately following the pay period from which this advance is made. I also agree that',
        'if I terminate employment prior to total repayment of this advance, I authorize the',
        'company to deduct any unpaid advance amount from the salary owed me at the time of',
        'termination of employment.'
    ];
    agreementText.forEach((line, index) => {
        page.drawText(line, { x: leftMargin, y: y - (index * 18), font: customFont, size: 11 });
    });

    // --- Signatures ---
    y -= 150;
    page.drawText('Employee signature:', { x: leftMargin, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: leftMargin + 125, y: y - 2 }, end: { x: leftMargin + 275, y: y - 2 }, thickness: 0.5 });
    page.drawText(data.employee_signature_name, { x: leftMargin + 127, y, font: customBoldFont, size: 11 });
    
    page.drawText('Date:', { x: width - 200, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: width - 165, y: y - 2 }, end: { x: width - 70, y: y - 2 }, thickness: 0.5 });
    page.drawText(new Date(data.request_date).toLocaleDateString('en-CA'), { x: width - 163, y, font: customBoldFont, size: 12 });
    
    y -= 50;
    page.drawText('Approved by:', { x: leftMargin, y, font: customFont, size: 12 });
    
    y -= 50;
    page.drawText('Supervisor signature:', { x: leftMargin, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: leftMargin + 135, y: y - 2 }, end: { x: leftMargin + 285, y: y - 2 }, thickness: 0.5 });
    if (data.supervisor_signature_name) {
        page.drawText(data.supervisor_signature_name, { x: leftMargin + 137, y, font: customBoldFont, size: 11 });
    }
    
    page.drawText('Date:', { x: width - 200, y, font: customFont, size: 12 });
    page.drawLine({ start: { x: width - 165, y: y - 2 }, end: { x: width - 70, y: y - 2 }, thickness: 0.5 });
    if (data.supervisor_signature_date) {
        page.drawText(new Date(data.supervisor_signature_date).toLocaleDateString('en-CA'), { x: width - 163, y, font: customBoldFont, size: 12 });
    }

    return await pdfDoc.save();
}


//compliant file download function
export interface ComplaintFormData {
    // Employee Information
    full_name: string;
    department: string;
    contact_number: string;
    
    // Complaint Details
    date_of_incident: string; // e.g., "2023-10-27"
    time_of_incident: string; // e.g., "14:30"
    location: string;

    // Nature of Complaint
    // Use a union type for strictness.
    nature_of_complaint: 'Harassment' | 'Unfair Treatment' | 'Workplace Safety' | 'Other';
    complaint_nature_other?: string;
    
    // Text areas
    description: string;
    resolution: string;

    // Acknowledgment
    is_acknowledged: boolean;
}

const drawSectionHeader = (page: PDFPage, y: number, text: string, font: PDFFont): number => {
    page.drawText(text, { 
        x: 50, 
        y, 
        font, 
        size: 14 
    });
    page.drawLine({
        start: { x: 50, y: y - 5 },
        end: { x: 545, y: y - 5 }, // Extends across most of the page
        thickness: 1,
    });
    // Return the new y-position, moved down to leave space after the header
    return y - 30; 
};

export async function generateComplaintFormPdf(data: ComplaintFormData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.27, 841.89]); // A4
    const { width, height } = page.getSize();

    // --- Load Fonts ---
    const fontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans.ttf');
    const boldFontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans-Bold.ttf');
    const fontBytes = await readFile(fontPath);
    const boldFontBytes = await readFile(boldFontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const customBoldFont = await pdfDoc.embedFont(boldFontBytes);

    const black = rgb(0, 0, 0);
    const gray = rgb(0.3, 0.3, 0.3);

    // --- Header ---
    const title = 'Employee Complaint Form';
    const titleWidth = customBoldFont.widthOfTextAtSize(title, 18);
    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 50,
        font: customBoldFont,
        size: 18,
    });

    let y = height - 80;

    // --- Employee Information Section ---
    y = drawSectionHeader(page, y, 'Employee Information', customBoldFont);
    const col1X = 55;
    const col2X = 320;

    page.drawText('Full Name', { x: col1X, y, font: customFont, size: 9, color: gray });
    page.drawText(data.full_name, { x: col1X, y: y - 15, font: customBoldFont, size: 11 });
    
    page.drawText('Department', { x: col2X, y, font: customFont, size: 9, color: gray });
    page.drawText(data.department, { x: col2X, y: y - 15, font: customBoldFont, size: 11 });
    
    y -= 40;
    page.drawText('Contact Number', { x: col1X, y, font: customFont, size: 9, color: gray });
    page.drawText(data.contact_number, { x: col1X, y: y - 15, font: customBoldFont, size: 11 });
    
    y -= 40;

    // --- Complaint Details Section ---
    y = drawSectionHeader(page, y, 'Complaint Details', customBoldFont);
    const col3X = 450;
    
    // ==================== FIX FOR "Invalid Date" ====================
    // Check if the date exists before trying to format it. If not, show 'N/A'.
    const incidentDateText = data.date_of_incident 
        ? new Date(data.date_of_incident).toLocaleDateString('en-CA') 
        : 'N/A';
    // ===============================================================

    page.drawText('Date of Incident', { x: col1X, y, font: customFont, size: 9, color: gray });
    page.drawText(incidentDateText, { x: col1X, y: y - 15, font: customBoldFont, size: 11 });
    
    page.drawText('Time of Incident', { x: col2X, y, font: customFont, size: 9, color: gray });
    page.drawText(data.time_of_incident, { x: col2X, y: y - 15, font: customBoldFont, size: 11 });

    page.drawText('Location', { x: col3X, y, font: customFont, size: 9, color: gray });
    page.drawText(data.location, { x: col3X, y: y - 15, font: customBoldFont, size: 11 });

    y -= 40;

    // --- Nature of Complaint Section ---
    y = drawSectionHeader(page, y, 'Nature of Complaint', customBoldFont);
    const complaintTypes = ['Harassment', 'Unfair Treatment', 'Workplace Safety', 'Other'];
    const radioXStart = 55;
    const radioY = y;
    
    complaintTypes.forEach((type, index) => {
        const xPos = radioXStart + (index * 130);
        // Draw the outer circle
        page.drawCircle({ x: xPos, y: radioY, size: 6, borderWidth: 1, borderColor: black });
        // If this type is selected, draw the inner filled circle
        if (data.nature_of_complaint === type) {
            page.drawCircle({ x: xPos, y: radioY, size: 3.5, color: black });
        }
        page.drawText(type, { x: xPos + 12, y: radioY - 4, font: customFont, size: 11 });
    });

    y -= 40;

    // --- Description of the Complaint ---
    page.drawText('Description of the Complaint', { x: 50, y, font: customFont, size: 10, color: gray });
    y -= 5;
    page.drawRectangle({ x: 50, y: y - 100, width: 495, height: 100, borderWidth: 0.5, borderColor: gray });
    page.drawText(data.description, { x: 55, y: y - 15, font: customFont, size: 10, lineHeight: 12, maxWidth: 485 });
    y -= 125;

    // --- Desired Resolution ---
    page.drawText('Desired Resolution (What resolution are you seeking?)', { x: 50, y, font: customFont, size: 10, color: gray });
    y -= 5;
    page.drawRectangle({ x: 50, y: y - 70, width: 495, height: 70, borderWidth: 0.5, borderColor: gray });
    page.drawText(data.resolution, { x: 55, y: y - 15, font: customFont, size: 10, lineHeight: 12, maxWidth: 485 });
    y -= 95;

    // --- Acknowledgment ---
    y = drawSectionHeader(page, y, 'Acknowledgment', customBoldFont);
    const checkboxSize = 12;
    // ==================== FIX FOR ACKNOWLEDGMENT CHECKBOX ====================
    // Draw the empty box first
    page.drawRectangle({ x: 55, y, width: checkboxSize, height: checkboxSize, borderWidth: 1, borderColor: black });
    // If acknowledged, draw a clean checkmark inside
    if (data.is_acknowledged) {
        page.drawText('✔', { x: 56.5, y: y - 1, font: customBoldFont, size: 12, color: black });
    }
    // ======================================================================
    page.drawText('I confirm the above information is true to the best of my knowledge.', { x: 55 + checkboxSize + 5, y: y + 2, font: customFont, size: 11 });

    return await pdfDoc.save();
}

//Over Time Request PDF Generation Function

export interface OvertimeRequestData {
    // Implicit Employee Info
    employee_name: string;
    department: string;
    request_date: string; // The date the form itself is submitted

    // Form Fields
    date_of_overtime: string; // e.g., "2023-10-28"
    type_of_overtime: 'Normal (1.5x Rate)' | 'Sunday (2.0x Rate)';
    hours_worked: number;
    reason: string;

    // For approval workflow (optional)
    supervisor_name?: string;
    supervisor_approval_date?: string;
}


export async function generateOvertimeRequestPdf(data: OvertimeRequestData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.27, 841.89]); // A4
    const { width, height } = page.getSize();

    // --- Load Fonts ---
    const fontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans.ttf');
    const boldFontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans-Bold.ttf');
    const fontBytes = await readFile(fontPath);
    const boldFontBytes = await readFile(boldFontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const customBoldFont = await pdfDoc.embedFont(boldFontBytes);

    const black = rgb(0, 0, 0);
    const gray = rgb(0.3, 0.3, 0.3);
    const leftMargin = 55;

    // --- Header ---
    const title = 'Overtime Request Form';
    page.drawText(title, { x: leftMargin, y: height - 50, font: customBoldFont, size: 24 });
    page.drawText('Complete the form below to request payment for overtime hours.', { x: leftMargin, y: height - 70, font: customFont, size: 11, color: gray });

    let y = height - 120;

    // --- Employee & Request Info ---
    page.drawText('Employee Name:', { x: leftMargin, y, font: customFont, size: 10 });
    page.drawText(data.employee_name, { x: leftMargin + 150, y, font: customBoldFont, size: 11 });

    page.drawText('Department:', { x: leftMargin + 300, y, font: customFont, size: 10 });
    page.drawText(data.department, { x: leftMargin + 370, y, font: customBoldFont, size: 11 });
    
    y -= 25;
    page.drawText('Date of Request:', { x: leftMargin, y, font: customFont, size: 10 });
    page.drawText(new Date(data.request_date).toLocaleDateString('en-CA'), { x: leftMargin + 150, y, font: customBoldFont, size: 11 });
    page.drawLine({ start: {x: 50, y: y - 10}, end: {x: 545, y: y - 10}, thickness: 0.5, color: rgb(0.8, 0.8, 0.8)});

    y -= 40;

    // --- Overtime Details ---
    page.drawText('Date of Overtime:', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    page.drawText(new Date(data.date_of_overtime).toLocaleDateString('en-CA'), { x: leftMargin, y: y - 18, font: customBoldFont, size: 12 });

    y -= 50;
    page.drawText('Hours Worked:', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    page.drawText(String(data.hours_worked), { x: leftMargin, y: y - 18, font: customBoldFont, size: 12 });

    y -= 50;
    page.drawText('Type of Overtime:', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    const overtimeTypes = ['Normal (1.5x Rate)', 'Sunday (2.0x Rate)'];
    
    overtimeTypes.forEach((type, index) => {
        const xPos = leftMargin + (index * 170);
        page.drawCircle({ x: xPos, y: y - 15, size: 6, borderWidth: 1, borderColor: black });
        if (data.type_of_overtime === type) {
            page.drawCircle({ x: xPos, y: y - 15, size: 3.5, color: black });
        }
        page.drawText(type, { x: xPos + 12, y: y - 19, font: customFont, size: 11 });
    });
    
    y -= 60;
    page.drawText('Reason for Overtime:', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    page.drawRectangle({
        x: leftMargin - 5,
        y: y - 105,
        width: width - (leftMargin * 2) + 10,
        height: 100,
        borderWidth: 0.5,
        borderColor: gray
    });
    page.drawText(data.reason, {
        x: leftMargin,
        y: y - 15,
        font: customFont,
        size: 10,
        lineHeight: 12,
        maxWidth: width - (leftMargin * 2)
    });

    y -= 150;

    // --- Signatures ---
    page.drawLine({ start: {x: 50, y: y + 20}, end: {x: 545, y: y + 20}, thickness: 0.5, color: rgb(0.8, 0.8, 0.8)});
    
    page.drawText('Employee Signature:', { x: leftMargin, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin, y: y - 30 }, end: { x: leftMargin + 220, y: y - 30 }, thickness: 1 });

    page.drawText('Date:', { x: leftMargin + 300, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin + 300, y: y - 30 }, end: { x: leftMargin + 480, y: y - 30 }, thickness: 1 });
    page.drawText(new Date(data.request_date).toLocaleDateString('en-CA'), { x: leftMargin + 305, y: y - 25, font: customBoldFont, size: 11 });

    y -= 70;
    page.drawText('Supervisor Approval:', { x: leftMargin, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin, y: y - 30 }, end: { x: leftMargin + 220, y: y - 30 }, thickness: 1 });
    if (data.supervisor_name) {
        page.drawText(data.supervisor_name, { x: leftMargin + 5, y: y - 25, font: customBoldFont, size: 11 });
    }

    page.drawText('Date:', { x: leftMargin + 300, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin + 300, y: y - 30 }, end: { x: leftMargin + 480, y: y - 30 }, thickness: 1 });
    if (data.supervisor_approval_date) {
        page.drawText(new Date(data.supervisor_approval_date).toLocaleDateString('en-CA'), { x: leftMargin + 305, y: y - 25, font: customBoldFont, size: 11 });
    }

    return await pdfDoc.save();
}

// Employee Loan Request PDF Generation Function
export interface LoanRequestData {
    // Employee Info
    employee_name: string;
    department: string;
    request_date: string;

    // Loan Details from the form/database
    loan_amount: number;
    loan_type: string;
    reason: string;
    repayment_terms?: string; // Optional field
    employee_signature_name: string;

    // Optional fields for the approval workflow
    supervisor_approval_name?: string;
    supervisor_approval_date?: string;
}

export async function generateLoanRequestPdf(data: LoanRequestData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.27, 841.89]); // A4
    const { width, height } = page.getSize();

    // --- Load Fonts ---
    const fontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans.ttf');
    const boldFontPath = path.join(process.cwd(), 'lib/assets/DejaVuSans-Bold.ttf');
    const fontBytes = await readFile(fontPath);
    const boldFontBytes = await readFile(boldFontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const customBoldFont = await pdfDoc.embedFont(boldFontBytes);

    
    const gray = rgb(0.3, 0.3, 0.3);
    const leftMargin = 55;

    // --- Header ---
    page.drawText('Employee Loan Request Form', { x: leftMargin, y: height - 50, font: customBoldFont, size: 24 });
    page.drawText('Complete the form below to apply for a company loan.', { x: leftMargin, y: height - 70, font: customFont, size: 11, color: gray });

    let y = height - 120;

    // --- Employee Info ---
    page.drawText('Employee Name:', { x: leftMargin, y, font: customFont, size: 10 });
    page.drawText(data.employee_name, { x: leftMargin + 150, y, font: customBoldFont, size: 11 });
    page.drawText('Department:', { x: leftMargin + 300, y, font: customFont, size: 10 });
    page.drawText(data.department, { x: leftMargin + 370, y, font: customBoldFont, size: 11 });
    y -= 25;
    page.drawText('Date of Request:', { x: leftMargin, y, font: customFont, size: 10 });
    page.drawText(new Date(data.request_date).toLocaleDateString('en-CA'), { x: leftMargin + 150, y, font: customBoldFont, size: 11 });
    page.drawLine({ start: {x: 50, y: y - 10}, end: {x: 545, y: y - 10}, thickness: 0.5, color: rgb(0.8, 0.8, 0.8)});
    
    y -= 40;

    // --- Loan Details ---
    page.drawText('Loan Amount Requested (N$)', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    const formattedAmount = `N$ ${data.loan_amount.toFixed(2)}`;
    page.drawText(formattedAmount, { x: leftMargin, y: y - 18, font: customBoldFont, size: 12 });
    
    y -= 50;
    page.drawText('Type of Loan', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    page.drawText(data.loan_type, { x: leftMargin, y: y - 18, font: customBoldFont, size: 12 });

    y -= 50;
    page.drawText('Reason for Loan', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    page.drawRectangle({ x: leftMargin - 5, y: y - 105, width: width - (leftMargin * 2) + 10, height: 100, borderWidth: 0.5, borderColor: gray });
    page.drawText(data.reason, { x: leftMargin, y: y - 15, font: customFont, size: 10, lineHeight: 12, maxWidth: width - (leftMargin * 2) });
    y -= 125;

    page.drawText('Proposed Repayment Terms (Optional)', { x: leftMargin, y, font: customFont, size: 10, color: gray });
    page.drawRectangle({ x: leftMargin - 5, y: y - 85, width: width - (leftMargin * 2) + 10, height: 80, borderWidth: 0.5, borderColor: gray });
    page.drawText(data.repayment_terms || '', { x: leftMargin, y: y - 15, font: customFont, size: 10, lineHeight: 12, maxWidth: width - (leftMargin * 2) });
    y -= 125;

    // --- Signatures ---
    page.drawLine({ start: {x: 50, y: y + 20}, end: {x: 545, y: y + 20}, thickness: 0.5, color: rgb(0.8, 0.8, 0.8)});
    
    page.drawText('Employee Signature:', { x: leftMargin, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin, y: y - 30 }, end: { x: leftMargin + 220, y: y - 30 }, thickness: 1 });
    page.drawText(data.employee_signature_name, { x: leftMargin + 5, y: y - 25, font: customBoldFont, size: 11 });

    page.drawText('Date:', { x: leftMargin + 300, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin + 300, y: y - 30 }, end: { x: leftMargin + 480, y: y - 30 }, thickness: 1 });
    page.drawText(new Date(data.request_date).toLocaleDateString('en-CA'), { x: leftMargin + 305, y: y - 25, font: customBoldFont, size: 11 });

    y -= 70;
    page.drawText('Management Approval:', { x: leftMargin, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin, y: y - 30 }, end: { x: leftMargin + 220, y: y - 30 }, thickness: 1 });

    page.drawText('Date:', { x: leftMargin + 300, y, font: customFont, size: 11 });
    page.drawLine({ start: { x: leftMargin + 300, y: y - 30 }, end: { x: leftMargin + 480, y: y - 30 }, thickness: 1 });

    return await pdfDoc.save();
}