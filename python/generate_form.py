from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import os

# Output path
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "employee_form.pdf")

# Logo path (assuming logo is in the same folder as this file)
LOGO_PATH = os.path.join(os.path.dirname(__file__), "../public/GMLogo.png")  # Adjust if needed

def generate_pdf():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=A4)
    width, height = A4

    # Draw logo (scale down)
    if os.path.exists(LOGO_PATH):
        c.drawImage(LOGO_PATH, x=40, y=height - 100, width=100, height=60, preserveAspectRatio=True)

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(160, height - 80, "Employee Registration Form")

    # Form Fields (you can add as many as you'd like)
    c.setFont("Helvetica", 12)
    fields = [
        "Full Name:",
        "Employee Number:",
        "Department:",
        "Job Title:",
        "Start Date:",
        "Email:",
        "Phone Number:",
        "Emergency Contact:",
    ]

    y = height - 140
    for label in fields:
        c.drawString(50, y, label)
        c.line(180, y - 2, 500, y - 2)
        y -= 30

    # Save PDF
    c.showPage()
    c.save()
    print(f"PDF generated at: {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_pdf()
