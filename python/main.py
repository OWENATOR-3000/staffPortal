import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch

# --- Pydantic Model for Data Validation ---
# This model defines the exact structure and data types that
# this API endpoint expects to receive from your Next.js app.
class LeaveRequestData(BaseModel):
    employee_name: str
    department: str | None = None
    supervisor_name: str
    start_date: str
    end_date: str
    reason_type: str
    reason_details: str | None = None
    number_of_hours: float
    comments: str | None = None
    employee_signature_name: str | None = None
    created_at: str

# Initialize the FastAPI app
app = FastAPI()

# --- PDF Drawing Logic ---
def draw_leave_form(c: canvas.Canvas, data: LeaveRequestData):
    """Draws the structured leave form onto the canvas using the provided data."""
    width, height = A4

    # Path to your company logo
    logo_path = os.path.join(os.path.dirname(__file__), "GMLogo.png")

    # Helper function for drawing lines
    def draw_line(x1, y, x2):
        c.line(x1, y - 2, x2, y - 2)

    # --- Header and Logo ---
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 230, height - 80, width=130, height=60, preserveAspectRatio=True)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 110, "Employee Leave Request Form")
    
    y = height - 150
    c.setFont("Helvetica", 12)

    # --- Employee Info Section ---
    c.drawString(50, y, "Employee Name:")
    c.drawString(160, y, data.employee_name)
    draw_line(150, y, 545)
    
    y -= 30
    c.drawString(50, y, "Date Submitted:")
    c.drawString(160, y, data.created_at)
    draw_line(150, y, 300)

    c.drawString(320, y, "Department:")
    c.drawString(410, y, data.department or 'N/A')
    draw_line(400, y, 545)
    
    y -= 30
    c.drawString(50, y, "Supervisor Name:")
    c.drawString(160, y, data.supervisor_name)
    draw_line(150, y, 545)
    
    # --- Reason Section ---
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "REASON FOR LEAVE")
    c.setFont("Helvetica", 11)
    
    y -= 25
    c.drawString(60, y, f"Type: {data.reason_type}")
    if data.reason_type == "Other" and data.reason_details:
        c.drawString(200, y, f"Details: {data.reason_details}")

    # --- Leave Requested Section ---
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "LEAVE REQUESTED")
    c.setFont("Helvetica", 11)
    
    y -= 25
    c.drawString(50, y, "From:")
    c.drawString(100, y, data.start_date)
    draw_line(90, y, 250)
    
    c.drawString(320, y, "To:")
    c.drawString(350, y, data.end_date)
    draw_line(340, y, 500)
    
    y -= 30
    diff_days = "N/A" # You can recalculate if needed, but receiving it is safer
    c.drawString(50, y, "Number of Hours:")
    c.drawString(160, y, str(data.number_of_hours))
    draw_line(150, y, 300)

    # --- Comments Section ---
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Comment(s):")
    c.setFont("Helvetica", 10)
    
    y -= 20
    # Simple text wrapping for comments
    text_object = c.beginText(55, y)
    text_object.setFont("Helvetica", 10)
    lines = (data.comments or "No comments.").split('\n')
    for line in lines:
        text_object.textLine(line)
    c.drawText(text_object)
    
    # --- Signatures Section ---
    y = 120 # Position signatures at a fixed location from the bottom
    c.setFont("Helvetica", 11)
    
    c.drawString(50, y, "Employee Signature:")
    if data.employee_signature_name:
        c.setFont("Helvetica-Oblique", 11) # Use a different font for signature
        c.drawString(180, y, data.employee_signature_name)
        c.setFont("Helvetica", 11)
    draw_line(170, y, 350)
    
    y -= 40
    c.drawString(50, y, "Supervisor Signature:")
    draw_line(170, y, 350)


# --- API Endpoint ---
@app.post("/create-leave-form-from-scratch")
async def create_pdf_from_scratch(data: LeaveRequestData):
    """
    Receives leave request data from the Next.js API, generates a PDF using
    ReportLab, and returns the file as a response.
    """
    # Use a temporary filename to avoid conflicts
    output_filename = f"temp_{os.urandom(8).hex()}.pdf"
    
    try:
        # Create a canvas and draw the form
        c = canvas.Canvas(output_filename, pagesize=A4)
        draw_leave_form(c, data)
        c.showPage()
        c.save()

        # Return the generated file. FastAPI handles sending and cleanup.
        return FileResponse(
            path=output_filename,
            filename=f"Leave_Request_{data.employee_name.replace(' ', '_')}.pdf",
            media_type='application/pdf'
        )
    except Exception as e:
        print(f"Error during PDF generation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error: Could not generate PDF.")