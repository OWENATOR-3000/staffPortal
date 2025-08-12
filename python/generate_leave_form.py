from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os

# Output file path
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "employee_leave_form.pdf")
LOGO_PATH = os.path.join(os.path.dirname(__file__), "../public/GMLogo.png")  # Adjust path as needed

def generate_blank_leave_form():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)
    width, height = A4

    # === Header and Logo ===
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, 230, height - 80, width=130, height=60, preserveAspectRatio=True)

    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 110, "Employee Leave Request Form")

    c.setFont("Helvetica", 12)
    y = height - 140

    # === Employee Info Section ===
    c.drawString(50, y, "Employee Name:")
    c.line(160, y - 2, 500, y - 2)

    y -= 25
    c.drawString(50, y, "Date:")
    c.line(160, y - 2, 300, y - 2)

    y -= 25
    c.drawString(50, y, "Supervisor Name:")
    c.line(160, y - 2, 500, y - 2)

    # === Reason Section ===
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "REASON FOR LEAVE")
    c.setFont("Helvetica", 12)

    checkbox_size = 10
    y -= 20
    reasons = [
        "Vacation", "Leave of Absence", "Sick - Family",
        "Sick - Self", "Dr. Appointment", "Sick Family",
        "Funeral For", "Other"
    ]
    positions = [
        (50, y), (180, y), (330, y),
        (50, y - 20), (180, y - 20), (50, y - 40),
        (50, y - 60), (50, y - 80)
    ]

    for label, (x, y_pos) in zip(reasons, positions):
        c.rect(x, y_pos, checkbox_size, checkbox_size)
        c.drawString(x + 15, y_pos, label)
        if label in ["Sick Family", "Funeral For", "Other"]:
            c.line(x + 100, y_pos + 2, 500, y_pos + 2)

    # === Leave Requested Section ===
    y = y - 100
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "LEAVE REQUESTED")
    c.setFont("Helvetica", 12)

    y -= 20
    c.drawString(50, y, "From:")
    c.line(100, y - 2, 200, y - 2)
    c.drawString(250, y, "To:")
    c.line(280, y - 2, 380, y - 2)

    y -= 25
    c.drawString(50, y, "Number of Hours:")
    c.line(160, y - 2, 260, y - 2)
    c.drawString(300, y, "Number of Days:")
    c.line(410, y - 2, 500, y - 2)

    # === Signatures Section ===
    y -= 40
    c.drawString(50, y, "Employee Signature:")
    c.line(180, y - 2, 300, y - 2)
    c.drawString(350, y, "Date:")
    c.line(390, y - 2, 500, y - 2)

    y -= 25
    c.drawString(50, y, "Supervisor Signature:")
    c.line(180, y - 2, 300, y - 2)
    c.drawString(350, y, "Date:")
    c.line(390, y - 2, 500, y - 2)

    # === Comments Section ===
    y -= 40
    c.drawString(50, y, "Comment(s):")
    y -= 15
    for _ in range(3):
        c.line(50, y, 500, y)
        y -= 15

    # Finalize
    c.showPage()
    c.save()
    print(f"Leave form generated: {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_blank_leave_form()
