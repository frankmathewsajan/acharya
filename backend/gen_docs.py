import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

PEOPLE = [
    {
        "name": "Frank Mathew Sajan",
        "dob": "19 June 2004",
        "father_name": "Mathew Sajan",
        "father_occupation": "Engineer",
        "mother_name": "Elizabeth Mathew",
        "mother_occupation": "Teacher",
        "address": "House No. 12, MG Road, Kochi, Kerala, India",
        "phone": "+91-9876543210",
        "email": "frank.sajan@example.com",
        "aadhaar": "1234 5678 9012",
    },
    {
        "name": "M Revanth",
        "dob": "15 August 2005",
        "father_name": "Mahesh Reddy",
        "father_occupation": "Doctor",
        "mother_name": "Lakshmi Reddy",
        "mother_occupation": "Homemaker",
        "address": "Plot 24, Jubilee Hills, Hyderabad, Telangana, India",
        "phone": "+91-9988776655",
        "email": "m.revanth@example.com",
        "aadhaar": "2345 6789 0123",
    },
    {
        "name": "Joseph Sajan",
        "dob": "05 May 2003",
        "father_name": "Thomas Sajan",
        "father_occupation": "Businessman",
        "mother_name": "Annie Sajan",
        "mother_occupation": "Nurse",
        "address": "Green Villa, Marine Drive, Ernakulam, Kerala, India",
        "phone": "+91-9123456780",
        "email": "joseph.sajan@example.com",
        "aadhaar": "3456 7890 1234",
    },
    {
        "name": "Veda Chita",
        "dob": "10 December 2006",
        "father_name": "Ramesh Chita",
        "father_occupation": "Bank Manager",
        "mother_name": "Sushma Chita",
        "mother_occupation": "Lawyer",
        "address": "Sunrise Apartments, Banjara Hills, Hyderabad, Telangana, India",
        "phone": "+91-9000001111",
        "email": "veda.chita@example.com",
        "aadhaar": "4567 8901 2345",
    },
    {
        "name": "Indrani Hazra",
        "dob": "22 March 2005",
        "father_name": "Prabir Hazra",
        "father_occupation": "Professor",
        "mother_name": "Sharmila Hazra",
        "mother_occupation": "Artist",
        "address": "Lake View Towers, Salt Lake City, Kolkata, West Bengal, India",
        "phone": "+91-9887766554",
        "email": "indrani.hazra@example.com",
        "aadhaar": "5678 9012 3456",
    },
    {
        "name": "Abhiram Jasthi",
        "dob": "01 January 2007",
        "father_name": "Suresh Jasthi",
        "father_occupation": "Government Officer",
        "mother_name": "Rekha Jasthi",
        "mother_occupation": "Teacher",
        "address": "Sri Nagar Colony, Vijayawada, Andhra Pradesh, India",
        "phone": "+91-9112233445",
        "email": "abhiram.jasthi@example.com",
        "aadhaar": "6789 0123 4567",
    },
]

# --------------------
# Utility functions
# --------------------
def draw_header(c, title, color):
    c.setFillColor(color)
    c.rect(0, 780, 600, 40, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(300, 790, title)
    c.setFillColor(colors.black)

def draw_footer(c, text, color):
    c.setFillColor(color)
    c.rect(0, 0, 600, 30, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 10)
    c.drawCentredString(300, 15, text)
    c.setFillColor(colors.black)

def draw_seal(c, x, y, text="OFFICIAL SEAL DEMO"):
    c.circle(x, y, 40)
    c.setFont("Helvetica", 8)
    for i, line in enumerate(text.split("\n")):
        c.drawCentredString(x, y - (i * 10), line)

# --------------------
# Document Generators
# --------------------
def make_birth_certificate(c, person):
    draw_header(c, "Government of India - Birth Certificate", colors.blue)
    y = 740
    details = [
        ("Name of Child", person['name']),
        ("Date of Birth", person['dob']),
        ("Father’s Name", f"{person['father_name']} ({person['father_occupation']})"),
        ("Mother’s Name", f"{person['mother_name']} ({person['mother_occupation']})"),
        ("Address", person['address']),
        ("Contact", f"{person['phone']} | {person['email']}"),
    ]
    c.setFont("Times-Roman", 12)
    for label, value in details:
        c.drawString(80, y, f"{label}: {value}")
        y -= 20
    c.drawString(80, y-20, "Registrar Signature: __________")
    draw_seal(c, 450, y, "BIRTH\nCERTIFICATE\nSEAL")
    draw_footer(c, "Issued under Births & Deaths Registration Act", colors.blue)

def make_aadhaar_card(c, person):
    draw_header(c, "AADHAAR CARD (DEMO)", colors.orange)
    c.rect(50, 600, 120, 120)
    c.setFont("Helvetica", 8)
    c.drawCentredString(110, 660, "QR CODE")
    x, y = 200, 700
    c.setFont("Helvetica", 12)
    details = [
        ("Name", person['name']),
        ("DOB", person['dob']),
        ("Aadhaar No", person['aadhaar']),
        ("Father", person['father_name']),
        ("Mother", person['mother_name']),
        ("Address", person['address']),
        ("Phone", person['phone']),
        ("Email", person['email']),
    ]
    for label, value in details:
        c.drawString(x, y, f"{label}: {value}")
        y -= 20
    draw_footer(c, "Government of India - Unique Identification Authority", colors.green)

def make_transfer_certificate(c, person):
    draw_header(c, "St. Joseph’s Public School - Transfer Certificate", colors.darkred)
    y = 740
    fields = [
        ("Student Name", person['name']),
        ("Father’s Name", f"{person['father_name']} ({person['father_occupation']})"),
        ("Mother’s Name", f"{person['mother_name']} ({person['mother_occupation']})"),
        ("Date of Birth", person['dob']),
        ("Address", person['address']),
        ("Contact", f"{person['phone']} | {person['email']}"),
    ]
    c.setFont("Times-Roman", 12)
    for label, value in fields:
        c.drawString(80, y, f"{label}: {value}")
        y -= 20
    # Fake marks table
    c.setFont("Helvetica-Bold", 12)
    c.drawString(80, y-20, "Academic Performance:")
    c.setFont("Helvetica", 11)
    y -= 50
    subjects = [("Maths", "A1"), ("Science", "A2"), ("English", "B1"), ("Social", "A1"), ("Hindi", "B2")]
    c.rect(70, y, 400, 20 * (len(subjects)+1))
    c.drawString(80, y+20*len(subjects), "Subject")
    c.drawString(300, y+20*len(subjects), "Grade")
    row_y = y + 20*(len(subjects)-1)
    for sub, grade in subjects:
        c.drawString(80, row_y, sub)
        c.drawString(300, row_y, grade)
        row_y -= 20
    draw_seal(c, 450, y, "SCHOOL\nSEAL\nDEMO")
    draw_footer(c, "Transfer Certificate issued by Principal", colors.darkred)

def make_caste_certificate(c, person):
    draw_header(c, "Caste Certificate (DEMO)", colors.green)
    y = 740
    details = [
        ("Name", person['name']),
        ("Father’s Name", person['father_name']),
        ("Mother’s Name", person['mother_name']),
        ("Date of Birth", person['dob']),
        ("Address", person['address']),
        ("Religion/Caste", "Hindu / OBC"),
        ("Issued By", "Tehsildar, District Office"),
    ]
    c.setFont("Times-Roman", 12)
    for label, value in details:
        c.drawString(80, y, f"{label}: {value}")
        y -= 20
    c.drawString(80, y-20, "Authority Signature: __________")
    draw_seal(c, 450, y, "GOVT\nCASTE\nCERTIFICATE")
    draw_footer(c, "District Collectorate - Demo Use Only", colors.green)

def make_passport_photo_doc(c, person):
    draw_header(c, "Passport Size Photograph (Placeholder)", colors.black)
    c.rect(220, 600, 150, 200)
    c.setFont("Helvetica", 10)
    c.drawCentredString(295, 690, "PHOTO HERE")
    c.setFont("Times-Roman", 12)
    c.drawCentredString(300, 550, f"Name: {person['name']}")
    draw_footer(c, "Passport Photo Submission Copy", colors.black)

# --------------------
# Master function
# --------------------
def generate_documents(person):
    folder = person['name'].replace(" ", "_")
    os.makedirs(folder, exist_ok=True)
    docs = [
        ("birth_certificate.pdf", make_birth_certificate),
        ("aadhaar_card.pdf", make_aadhaar_card),
        ("transfer_certificate.pdf", make_transfer_certificate),
        ("caste_certificate.pdf", make_caste_certificate),
        ("passport_photo.pdf", make_passport_photo_doc),
    ]
    for filename, maker in docs:
        path = os.path.join(folder, filename)
        c = canvas.Canvas(path, pagesize=A4)
        maker(c, person)
        c.showPage()
        c.save()
    print(f"✅ Documents generated for {person['name']} in {folder}/")

if __name__ == "__main__":
    for p in PEOPLE:
        generate_documents(p)
