"""
Data generator for VoteVision AI
Generates rich constituency profiles for Indian Lok Sabha (543 seats) and key candidates across all 28 states and 8 UTs.
"""
import json
import os

STATES_SEATS = [
    ("Uttar Pradesh", "UP", 80, [
        ("Varanasi", "BJP", "INC", 15.2, 56.4, 58.6, "Urban", 77.1),
        ("Rae Bareli", "INC", "BJP", 29.4, 53.6, 58.1, "Semi-Urban", 67.3),
        ("Amethi", "INC", "BJP", 17.8, 54.1, 54.3, "Rural", 69.2),
        ("Lucknow", "BJP", "SP", 11.2, 54.8, 52.3, "Urban", 82.5),
        ("Faizabad (Ayodhya)", "SP", "BJP", 4.2, 59.1, 59.2, "Semi-Urban", 70.6),
        ("Gorakhpur", "BJP", "SP", 9.8, 59.8, 54.9, "Semi-Urban", 70.8),
        ("Kannauj", "SP", "BJP", 6.1, 60.9, 61.1, "Rural", 72.7),
        ("Mainpuri", "SP", "BJP", 18.5, 56.8, 58.7, "Rural", 75.8),
        ("Muzaffarnagar", "SP", "BJP", 2.1, 68.4, 59.3, "Rural", 69.1),
        ("Meerut", "BJP", "SP", 1.2, 64.3, 58.9, "Urban", 76.8),
        ("Ghaziabad", "BJP", "INC", 22.4, 55.9, 49.9, "Urban", 78.1),
        ("Gautam Buddha Nagar", "BJP", "SP", 29.8, 60.5, 53.6, "Urban", 80.1),
        ("Agra", "BJP", "SP", 18.9, 59.1, 54.1, "Urban", 73.1),
        ("Aligarh", "BJP", "SP", 2.3, 61.7, 56.9, "Semi-Urban", 67.5),
        ("Mathura", "BJP", "INC", 26.4, 61.1, 49.4, "Rural", 70.4),
        ("Kanpur", "BJP", "INC", 2.8, 51.7, 53.1, "Urban", 79.7),
        ("Allahabad", "INC", "BJP", 5.2, 51.8, 51.8, "Urban", 72.3),
        ("Phulpur", "BJP", "SP", 0.4, 48.7, 48.9, "Rural", 68.1),
        ("Bansgaon", "BJP", "INC", 0.3, 55.4, 51.6, "Rural", 61.5),
        ("Salempur", "SP", "BJP", 0.5, 55.4, 51.4, "Rural", 64.2),
        ("Basti", "SP", "BJP", 8.2, 57.1, 56.7, "Rural", 67.2),
        ("Ambedkar Nagar", "SP", "BJP", 9.8, 61.1, 61.5, "Rural", 72.2),
        ("Azamgarh", "SP", "BJP", 12.3, 57.6, 56.2, "Semi-Urban", 71.0),
        ("Lalganj", "SP", "BJP", 8.4, 54.9, 54.4, "Rural", 68.9),
        ("Jaunpur", "SP", "BJP", 7.1, 55.8, 55.6, "Rural", 71.6),
        ("Machhlishahr", "SP", "BJP", 3.1, 56.0, 54.5, "Rural", 69.2),
        ("Ghazipur", "SP", "BJP", 10.4, 58.9, 55.5, "Rural", 71.8),
        ("Chandauli", "SP", "BJP", 2.1, 61.8, 60.3, "Rural", 71.7),
        ("Mirzapur", "BJP", "SP", 3.2, 60.1, 57.9, "Rural", 68.5),
        ("Robertsganj", "SP", "BJP", 8.9, 57.4, 56.8, "Rural", 64.0),
    ]),
    ("Maharashtra", "MH", 48, [
        ("Baramati", "INC", "BJP", 11.8, 61.7, 59.5, "Rural", 78.4),
        ("Nagpur", "BJP", "INC", 10.8, 54.9, 54.1, "Urban", 88.4),
        ("Mumbai South", "SSUBT", "SHS", 7.2, 51.6, 50.1, "Urban", 87.2),
        ("Mumbai North", "BJP", "INC", 32.4, 60.1, 57.0, "Urban", 88.9),
        ("Mumbai North Central", "INC", "BJP", 1.8, 53.7, 52.0, "Urban", 86.5),
        ("Pune", "BJP", "INC", 5.8, 49.8, 53.5, "Urban", 86.2),
        ("Thane", "SHS", "SSUBT", 14.5, 49.2, 52.1, "Urban", 84.5),
        ("Kalyan", "SHS", "SSUBT", 24.1, 45.3, 50.1, "Urban", 82.3),
        ("Nashik", "SSUBT", "SHS", 12.3, 59.4, 60.8, "Semi-Urban", 82.3),
        ("Kolhapur", "INC", "SHS", 11.2, 70.7, 71.6, "Semi-Urban", 81.5),
        ("Satara", "BJP", "INC", 2.4, 60.5, 63.2, "Rural", 82.9),
        ("Amravati", "INC", "BJP", 1.6, 60.8, 63.7, "Semi-Urban", 87.4),
        ("Nanded", "INC", "BJP", 5.2, 65.2, 60.9, "Rural", 75.5),
        ("Dharashiv", "SSUBT", "SHS", 22.4, 63.8, 63.9, "Rural", 78.4),
        ("Aurangabad", "SHS", "SSUBT", 9.8, 63.6, 63.0, "Urban", 79.0),
    ]),
    ("West Bengal", "WB", 42, [
        ("Diamond Harbour", "AITC", "BJP", 37.4, 82.0, 81.5, "Semi-Urban", 76.5),
        ("Kolkata South", "AITC", "BJP", 16.2, 69.8, 66.4, "Urban", 87.2),
        ("Kolkata North", "AITC", "BJP", 8.4, 65.8, 63.6, "Urban", 86.1),
        ("Darjeeling", "BJP", "AITC", 12.3, 78.8, 74.8, "Semi-Urban", 79.6),
        ("Asansol", "AITC", "BJP", 5.1, 76.6, 73.3, "Urban", 78.7),
        ("Medinipur", "AITC", "BJP", 2.2, 84.2, 81.6, "Rural", 83.1),
        ("Tamluk", "BJP", "AITC", 5.8, 85.4, 84.8, "Rural", 86.0),
        ("Baharampur", "INC", "AITC", 6.8, 79.4, 77.5, "Rural", 70.5),
        ("Maldaha Dakshin", "INC", "BJP", 8.9, 81.2, 76.7, "Rural", 61.7),
        ("Ranaghat", "BJP", "AITC", 10.4, 84.3, 81.9, "Rural", 75.3),
        ("Bangaon", "BJP", "AITC", 4.9, 82.6, 81.0, "Rural", 80.3),
        ("Howrah", "AITC", "BJP", 12.8, 74.8, 71.7, "Urban", 83.3),
    ]),
    ("Bihar", "BR", 40, [
        ("Patna Sahib", "BJP", "INC", 13.5, 45.8, 46.8, "Urban", 82.7),
        ("Pataliputra", "SP", "BJP", 5.6, 56.4, 56.9, "Rural", 69.5),
        ("Saran", "BJP", "SP", 1.8, 56.6, 56.8, "Rural", 66.0),
        ("Hajipur", "BJP", "SP", 14.8, 55.4, 58.4, "Semi-Urban", 66.8),
        ("Gaya", "BJP", "SP", 8.7, 56.2, 52.8, "Semi-Urban", 63.7),
        ("Kishanganj", "INC", "JDU", 5.4, 66.4, 64.0, "Rural", 55.5),
        ("Katihar", "INC", "JDU", 4.2, 67.6, 63.8, "Rural", 52.2),
        ("Purnia", "INC", "JDU", 2.1, 65.4, 63.1, "Rural", 51.1),
        ("Ujiarpur", "BJP", "SP", 4.9, 60.2, 58.8, "Rural", 65.3),
        ("Begusarai", "BJP", "INC", 6.5, 62.6, 58.7, "Semi-Urban", 63.9),
    ]),
    ("Tamil Nadu", "TN", 39, [
        ("Chennai South", "DMK", "BJP", 18.2, 57.1, 54.3, "Urban", 89.2),
        ("Chennai Central", "DMK", "BJP", 24.1, 59.0, 53.9, "Urban", 87.7),
        ("Coimbatore", "DMK", "BJP", 9.8, 63.9, 64.8, "Urban", 84.0),
        ("Madurai", "DMK", "BJP", 19.5, 66.1, 62.0, "Urban", 83.4),
        ("Thoothukkudi", "DMK", "BJP", 34.2, 69.5, 66.9, "Semi-Urban", 86.2),
        ("Sriperumbudur", "DMK", "BJP", 32.8, 62.4, 60.2, "Semi-Urban", 84.5),
        ("Kanyakumari", "INC", "BJP", 11.4, 69.9, 65.5, "Semi-Urban", 91.7),
        ("Sivaganga", "INC", "BJP", 17.8, 69.9, 64.3, "Rural", 79.9),
        ("Dharmapuri", "DMK", "BJP", 2.1, 82.4, 81.5, "Rural", 68.5),
    ]),
    ("Madhya Pradesh", "MP", 29, [
        ("Chhindwara", "BJP", "INC", 7.9, 82.4, 79.8, "Rural", 71.2),
        ("Indore", "BJP", "OTH", 78.4, 69.3, 61.7, "Urban", 85.9),
        ("Bhopal", "BJP", "INC", 28.5, 65.7, 64.1, "Urban", 80.4),
        ("Gwalior", "BJP", "INC", 5.2, 60.2, 62.1, "Urban", 76.7),
        ("Jabalpur", "BJP", "INC", 32.1, 69.4, 61.0, "Urban", 81.1),
        ("Vidisha", "BJP", "INC", 46.5, 71.8, 74.5, "Rural", 70.5),
        ("Morena", "BJP", "INC", 4.1, 61.9, 58.9, "Rural", 71.0),
    ]),
    ("Karnataka", "KA", 28, [
        ("Bengaluru South", "BJP", "INC", 22.4, 53.7, 53.2, "Urban", 89.0),
        ("Bengaluru Rural", "BJP", "INC", 16.5, 64.9, 68.3, "Semi-Urban", 78.5),
        ("Bengaluru Central", "BJP", "INC", 2.9, 54.3, 54.1, "Urban", 88.6),
        ("Mysuru", "BJP", "INC", 9.4, 69.5, 70.6, "Semi-Urban", 72.8),
        ("Shivamogga", "BJP", "INC", 16.8, 76.6, 78.3, "Rural", 80.5),
        ("Hassan", "INC", "BJP", 3.2, 77.3, 77.7, "Rural", 76.1),
        ("Belagavi", "BJP", "INC", 13.9, 67.8, 71.5, "Semi-Urban", 73.5),
        ("Kalaburagi", "INC", "BJP", 2.4, 61.1, 62.3, "Rural", 64.9),
    ]),
    ("Gujarat", "GJ", 26, [
        ("Gandhinagar", "BJP", "INC", 52.8, 66.1, 59.8, "Urban", 84.2),
        ("Varanasi-West (Surat)", "BJP", "INC", 82.1, 64.6, 56.7, "Urban", 87.9),
        ("Ahmedabad East", "BJP", "INC", 41.2, 61.8, 54.7, "Urban", 85.3),
        ("Rajkot", "BJP", "INC", 34.6, 63.5, 59.7, "Urban", 81.0),
        ("Banaskantha", "INC", "BJP", 2.7, 65.0, 69.7, "Rural", 65.3),
        ("Porbandar", "BJP", "INC", 31.9, 57.2, 51.8, "Semi-Urban", 75.8),
    ]),
    ("Rajasthan", "RJ", 25, [
        ("Jaipur", "BJP", "INC", 27.2, 68.5, 63.4, "Urban", 83.3),
        ("Kota", "BJP", "INC", 3.1, 70.2, 71.2, "Urban", 76.6),
        ("Jodhpur", "BJP", "INC", 9.8, 69.5, 64.3, "Urban", 79.0),
        ("Barmer", "INC", "BJP", 9.1, 73.3, 75.9, "Rural", 56.5),
        ("Churu", "INC", "BJP", 5.6, 65.9, 63.6, "Rural", 66.8),
        ("Dausa", "INC", "BJP", 4.3, 61.5, 55.7, "Rural", 68.2),
        ("Nagaur", "INC", "BJP", 3.5, 62.3, 57.3, "Rural", 62.8),
    ]),
    ("Andhra Pradesh", "AP", 25, [
        ("Vijayawada", "TDP", "YSRCP", 19.8, 77.3, 79.4, "Urban", 81.2),
        ("Visakhapatnam", "TDP", "YSRCP", 29.5, 67.8, 71.1, "Urban", 81.8),
        ("Guntur", "TDP", "YSRCP", 24.2, 79.2, 78.8, "Urban", 78.4),
        ("Kadapa", "YSRCP", "TDP", 5.2, 78.7, 79.6, "Semi-Urban", 67.3),
        ("Tirupati", "YSRCP", "BJP", 1.2, 79.8, 79.1, "Semi-Urban", 75.6),
        ("Rajahmundry", "BJP", "YSRCP", 18.2, 81.5, 81.9, "Semi-Urban", 74.0),
    ]),
    ("Kerala", "KL", 20, [
        ("Wayanad", "INC", "BJP", 32.4, 80.3, 73.6, "Rural", 89.0),
        ("Thiruvananthapuram", "INC", "BJP", 1.8, 73.7, 66.5, "Urban", 93.0),
        ("Thrissur", "BJP", "INC", 7.2, 77.9, 72.9, "Urban", 95.1),
        ("Ernakulam", "INC", "OTH", 24.2, 77.6, 65.8, "Urban", 95.9),
        ("Vadakara", "INC", "OTH", 8.9, 82.7, 78.4, "Semi-Urban", 93.7),
        ("Alappuzha", "INC", "OTH", 5.6, 80.4, 75.1, "Semi-Urban", 95.7),
    ]),
    ("Telangana", "TG", 17, [
        ("Hyderabad", "OTH", "BJP", 24.8, 44.8, 48.5, "Urban", 83.0),
        ("Secunderabad", "BJP", "INC", 4.2, 46.5, 49.3, "Urban", 80.5),
        ("Malkajgiri", "BJP", "INC", 22.8, 49.6, 50.8, "Urban", 86.8),
        ("Chevella", "BJP", "INC", 11.2, 53.2, 56.4, "Semi-Urban", 73.8),
        ("Nalgonda", "INC", "BJP", 41.5, 74.1, 74.0, "Rural", 63.8),
    ]),
    ("Odisha", "OD", 21, [
        ("Bhubaneswar", "BJP", "OTH", 3.2, 59.2, 60.1, "Urban", 84.0),
        ("Puri", "BJP", "OTH", 16.4, 72.7, 75.4, "Semi-Urban", 84.7),
        ("Sambalpur", "BJP", "OTH", 8.8, 76.4, 79.5, "Semi-Urban", 76.2),
        ("Koraput", "INC", "BJP", 9.8, 75.3, 77.5, "Rural", 49.2),
    ]),
    ("Punjab", "PB", 13, [
        ("Amritsar", "INC", "AAP", 4.5, 57.1, 56.1, "Urban", 76.3),
        ("Ludhiana", "INC", "AAP", 2.1, 62.2, 60.1, "Urban", 82.2),
        ("Bathinda", "OTH", "AAP", 5.2, 74.2, 69.4, "Rural", 68.3),
        ("Jalandhar", "INC", "BJP", 17.5, 63.0, 59.7, "Urban", 82.5),
        ("Sangrur", "AAP", "INC", 16.8, 72.4, 64.6, "Rural", 68.0),
    ]),
    ("Delhi", "DL", 7, [
        ("New Delhi", "BJP", "AAP", 8.9, 56.9, 55.4, "Urban", 88.3),
        ("East Delhi", "BJP", "AAP", 7.8, 61.7, 54.4, "Urban", 88.8),
        ("Chandni Chowk", "BJP", "INC", 6.8, 62.8, 58.6, "Urban", 87.0),
        ("North East Delhi", "BJP", "INC", 10.2, 63.6, 62.9, "Urban", 83.1),
    ]),
    ("Jammu & Kashmir", "JK", 5, [
        ("Srinagar", "OTH", "OTH", 28.5, 14.4, 38.5, "Urban", 69.2),
        ("Baramulla", "OTH", "OTH", 21.4, 34.6, 59.1, "Semi-Urban", 63.5),
        ("Anantnag-Rajouri", "OTH", "OTH", 29.8, 8.9, 54.8, "Rural", 62.2),
        ("Jammu", "BJP", "INC", 13.5, 72.5, 72.2, "Urban", 83.5),
        ("Udhampur", "BJP", "INC", 4.2, 70.2, 68.3, "Rural", 68.4),
    ]),
    ("Assam", "AS", 14, [
        ("Guwahati", "BJP", "INC", 22.8, 80.8, 78.4, "Urban", 88.5),
        ("Dhubri", "INC", "OTH", 42.1, 90.7, 92.1, "Rural", 58.3),
        ("Dibrugarh", "BJP", "OTH", 26.4, 77.3, 76.7, "Semi-Urban", 76.1),
    ]),
    ("Jharkhand", "JH", 14, [
        ("Ranchi", "BJP", "INC", 8.9, 64.5, 62.1, "Urban", 76.1),
        ("Khunti", "INC", "BJP", 16.5, 69.3, 69.9, "Rural", 63.9),
        ("Dhanbad", "BJP", "INC", 24.1, 60.5, 62.1, "Urban", 74.5),
    ]),
    ("Chhattisgarh", "CG", 11, [
        ("Raipur", "BJP", "INC", 38.5, 66.1, 68.8, "Urban", 75.6),
        ("Bastar", "BJP", "INC", 4.8, 66.0, 68.3, "Rural", 54.4),
        ("Rajnandgaon", "BJP", "INC", 3.2, 76.2, 77.4, "Semi-Urban", 75.9),
    ]),
    ("Haryana", "HR", 10, [
        ("Gurgaon", "BJP", "INC", 5.2, 67.3, 62.0, "Urban", 84.7),
        ("Rohtak", "INC", "BJP", 2.8, 70.5, 65.7, "Semi-Urban", 80.2),
        ("Hisar", "INC", "BJP", 5.1, 72.4, 65.5, "Rural", 72.9),
        ("Ambala", "INC", "BJP", 4.2, 71.1, 67.3, "Semi-Urban", 81.7),
    ]),
    ("Himachal Pradesh", "HP", 4, [
        ("Mandi", "BJP", "INC", 7.8, 73.6, 73.1, "Rural", 81.5),
        ("Hamirpur", "BJP", "INC", 16.4, 72.8, 71.6, "Rural", 88.2),
        ("Shimla", "BJP", "INC", 7.9, 72.7, 71.3, "Semi-Urban", 83.6),
        ("Kangra", "BJP", "INC", 22.8, 70.5, 68.4, "Semi-Urban", 85.7),
    ]),
    ("Uttarakhand", "UK", 5, [
        ("Haridwar", "BJP", "INC", 11.2, 69.2, 63.5, "Semi-Urban", 73.4),
        ("Nainital-Udhamsingh Nagar", "BJP", "INC", 22.5, 68.9, 61.4, "Semi-Urban", 73.9),
        ("Tehri Garhwal", "BJP", "INC", 23.4, 58.9, 53.8, "Rural", 76.4),
    ]),
    ("Goa", "GA", 2, [
        ("North Goa", "BJP", "INC", 18.2, 77.1, 75.2, "Semi-Urban", 89.6),
        ("South Goa", "INC", "BJP", 2.4, 73.3, 73.0, "Semi-Urban", 87.6),
    ]),
    ("Tripura", "TR", 2, [
        ("Tripura West", "BJP", "INC", 48.5, 81.9, 81.5, "Semi-Urban", 87.8),
        ("Tripura East", "BJP", "OTH", 42.1, 82.9, 80.4, "Rural", 83.2),
    ]),
    ("Manipur", "MN", 2, [
        ("Inner Manipur", "INC", "BJP", 18.9, 81.1, 80.2, "Semi-Urban", 79.9),
        ("Outer Manipur", "INC", "OTH", 12.3, 84.1, 77.2, "Rural", 73.4),
    ]),
    ("Meghalaya", "ML", 2, [
        ("Shillong", "OTH", "INC", 32.1, 65.5, 73.8, "Semi-Urban", 74.4),
        ("Tura", "INC", "OTH", 18.4, 81.4, 81.3, "Rural", 70.4),
    ]),
    ("Nagaland", "NL", 1, [
        ("Nagaland", "INC", "BJP", 7.8, 83.0, 56.8, "Rural", 79.6),
    ]),
    ("Mizoram", "MZ", 1, [
        ("Mizoram", "OTH", "BJP", 9.4, 63.1, 56.6, "Semi-Urban", 91.3),
    ]),
    ("Sikkim", "SK", 1, [
        ("Sikkim", "OTH", "BJP", 24.1, 78.8, 79.9, "Semi-Urban", 81.4),
    ]),
    ("Arunachal Pradesh", "AR", 2, [
        ("Arunachal West", "BJP", "INC", 14.5, 78.5, 73.6, "Rural", 65.4),
        ("Arunachal East", "BJP", "INC", 18.2, 87.0, 79.5, "Rural", 66.0),
    ]),
    ("Puducherry", "PY", 1, [
        ("Puducherry", "INC", "BJP", 18.9, 81.3, 78.9, "Urban", 85.8),
    ]),
    ("Chandigarh", "CH", 1, [
        ("Chandigarh", "INC", "BJP", 0.5, 70.6, 67.9, "Urban", 86.1),
    ]),
    ("Ladakh", "LA", 1, [
        ("Ladakh", "OTH", "INC", 22.4, 71.1, 71.8, "Rural", 77.5),
    ]),
    ("Andaman and Nicobar Islands", "AN", 1, [
        ("Andaman and Nicobar Islands", "BJP", "INC", 1.2, 65.2, 64.1, "Rural", 86.6),
    ]),
    ("Dadra and Nagar Haveli and Daman and Diu", "DN", 2, [
        ("Dadra and Nagar Haveli", "BJP", "INC", 9.5, 79.6, 72.5, "Rural", 76.2),
        ("Daman and Diu", "OTH", "BJP", 8.4, 71.8, 68.8, "Semi-Urban", 87.1),
    ]),
    ("Lakshadweep", "LD", 1, [
        ("Lakshadweep", "INC", "OTH", 3.2, 85.2, 84.1, "Rural", 91.8),
    ]),
]

def build_data():
    constituencies = []
    candidates = []

    cid_counter = 1
    cand_counter = 1

    # Map state codes and targets to reach full 543 distribution
    for state_name, state_code, target_seats, key_records in STATES_SEATS:
        # First add detailed key records
        created_for_state = 0
        for item in key_records:
            name, winner, runner, margin, t19, t24, demo, lit = item
            cid = f"{state_code}-{name.split()[0].upper().replace('(', '').replace(')', '')}"
            
            # Risk & confidence determination
            if margin < 3.0:
                risk = "High (Battleground)"
                conf = "Low"
                win_prob = round(50.0 + (margin * 1.8), 1)
            elif margin < 8.0:
                risk = "Competitive"
                conf = "Medium"
                win_prob = round(54.0 + (margin * 1.5), 1)
            else:
                risk = "Safe / Stronghold"
                conf = "High"
                win_prob = round(min(94.0, 65.0 + (margin * 0.6)), 1)

            # Simulated voter base
            electors = 1500000 + (cid_counter * 12345) % 800000

            issues = ["Employment", "Infrastructure", "Agriculture", "Inflation"]
            if demo == "Urban":
                issues = ["Urban Transit", "Jobs & Tech", "Pollution", "Cost of Living"]
            elif demo == "Rural":
                issues = ["MSP & Crop Insurance", "Irrigation", "Rural Roads", "Fertilizer Subsidies"]

            c_obj = {
                "id": cid,
                "uid": cid_counter,
                "name": name,
                "state": state_name,
                "state_code": state_code,
                "electors": electors,
                "demographic_type": demo,
                "literacy_rate": lit,
                "winner_2019": winner if margin > 5 else runner,
                "margin_pct_2019": round(abs(margin + 2.4), 1),
                "turnout_2019": t19,
                "winner_2024": winner,
                "margin_pct_2024": margin,
                "turnout_2024": t24,
                "leading_party": winner,
                "runner_up_party": runner,
                "projected_vote_share_lead": round(win_prob * 0.68, 1),
                "projected_vote_share_runner": round((100 - win_prob * 0.68) * 0.72, 1),
                "win_probability": win_prob,
                "predicted_margin": margin,
                "risk_level": risk,
                "confidence": conf,
                "key_issues": issues,
                "past_swing": round(t24 - t19, 1),
                "historical_winner_2014": winner if (cid_counter % 2 == 0) else runner
            }
            constituencies.append(c_obj)
            created_for_state += 1
            cid_counter += 1

            # Create lead candidate & runner-up candidate
            cand1_name = f"Leading Candidate ({name})"
            cand2_name = f"Challenger ({name})"
            
            # Prominent actual names for key races
            if name == "Varanasi":
                cand1_name = "Narendra Modi"
                cand2_name = "Ajay Rai"
            elif name == "Rae Bareli":
                cand1_name = "Rahul Gandhi"
                cand2_name = "Dinesh Pratap Singh"
            elif name == "Wayanad":
                cand1_name = "Rahul Gandhi / Priyanka Gandhi"
                cand2_name = "K. Surendran"
            elif name == "Gandhinagar":
                cand1_name = "Amit Shah"
                cand2_name = "Sonal Patel"
            elif name == "Baramati":
                cand1_name = "Supriya Sule"
                cand2_name = "Sunetra Pawar"
            elif name == "Diamond Harbour":
                cand1_name = "Abhishek Banerjee"
                cand2_name = "Abhijit Das"
            elif name == "Hyderabad":
                cand1_name = "Asaduddin Owaisi"
                cand2_name = "Madhavi Latha"
            elif name == "Thiruvananthapuram":
                cand1_name = "Shashi Tharoor"
                cand2_name = "Rajeev Chandrasekhar"
            elif name == "Mandi":
                cand1_name = "Kangana Ranaut"
                cand2_name = "Vikramaditya Singh"
            elif name == "Nagpur":
                cand1_name = "Nitin Gadkari"
                cand2_name = "Vikas Thakre"

            candidates.append({
                "id": f"CAND-{cand_counter}",
                "name": cand1_name,
                "party": winner,
                "constituency_id": cid,
                "constituency_name": name,
                "state": state_name,
                "age": 45 + (cid_counter % 28),
                "education": "Post Graduate" if (cid_counter % 3 == 0) else "Graduate",
                "assets_inr_cr": round(2.5 + ((cid_counter * 7.1) % 45), 2),
                "criminal_cases": (cid_counter % 4 == 0),
                "terms_served": 1 + (cid_counter % 4),
                "incumbency_status": "Incumbent MP",
                "past_vote_share": round(win_prob * 0.7, 1),
                "win_probability": win_prob,
                "strengths": ["High local visibility", "Strong ground party cadre", "Development deliverables"],
                "weaknesses": ["Anti-incumbency fatigue", "Local unemployment concerns"]
            })
            cand_counter += 1

            candidates.append({
                "id": f"CAND-{cand_counter}",
                "name": cand2_name,
                "party": runner,
                "constituency_id": cid,
                "constituency_name": name,
                "state": state_name,
                "age": 40 + (cid_counter % 25),
                "education": "Graduate",
                "assets_inr_cr": round(1.2 + ((cid_counter * 4.3) % 25), 2),
                "criminal_cases": (cid_counter % 5 == 0),
                "terms_served": (cid_counter % 2),
                "incumbency_status": "Challenger",
                "past_vote_share": round((100 - win_prob * 0.7) * 0.8, 1),
                "win_probability": round(100 - win_prob, 1),
                "strengths": ["Strong youth support", "Anti-incumbency consolidation", "Social media outreach"],
                "weaknesses": ["Fragmented booth organization", "Limited financial resources"]
            })
            cand_counter += 1

        # Fill remaining seats for the state to reach target_seats
        parties_pool = ["BJP", "INC", "SP", "AITC", "TDP", "JDU", "SHS", "SSUBT", "AAP", "DMK", "YSRCP", "OTH"]
        while created_for_state < target_seats:
            num = created_for_state + 1
            name = f"{state_name} Constituency #{num}"
            cid = f"{state_code}-SEAT-{num:02d}"
            
            # Predictable demographic & political mix based on state lean
            if state_code in ["UP", "MP", "GJ", "RJ", "DL", "UK", "HP"]:
                p_win = "BJP" if (num % 5 != 0) else ("SP" if state_code == "UP" else "INC")
                p_run = "INC" if p_win == "BJP" else "BJP"
            elif state_code in ["TN"]:
                p_win = "DMK" if (num % 6 != 0) else "INC"
                p_run = "BJP" if (num % 2 == 0) else "OTH"
            elif state_code in ["WB"]:
                p_win = "AITC" if (num % 3 != 0) else "BJP"
                p_run = "BJP" if p_win == "AITC" else "AITC"
            elif state_code in ["AP"]:
                p_win = "TDP" if (num % 4 != 0) else "YSRCP"
                p_run = "YSRCP" if p_win == "TDP" else "TDP"
            elif state_code in ["KL"]:
                p_win = "INC" if (num % 4 != 0) else "OTH"
                p_run = "OTH" if p_win == "INC" else "INC"
            elif state_code in ["MH"]:
                p_win = ["BJP", "INC", "SSUBT", "SHS"][num % 4]
                p_run = "INC" if p_win in ["BJP", "SHS"] else "BJP"
            else:
                p_win = parties_pool[(cid_counter + num) % len(parties_pool)]
                p_run = "INC" if p_win != "INC" else "BJP"

            margin = round(1.2 + ((num * 3.7) % 24), 1)
            t19 = round(56.0 + ((num * 5.3) % 24), 1)
            t24 = round(t19 + (((num * 2.1) % 7) - 3.2), 1)
            demo = "Rural" if (num % 3 == 0) else ("Urban" if (num % 5 == 0) else "Semi-Urban")
            lit = round(64.0 + ((num * 4.3) % 25), 1)

            if margin < 3.0:
                risk = "High (Battleground)"
                conf = "Low"
                win_prob = round(50.0 + (margin * 1.8), 1)
            elif margin < 8.0:
                risk = "Competitive"
                conf = "Medium"
                win_prob = round(54.0 + (margin * 1.5), 1)
            else:
                risk = "Safe / Stronghold"
                conf = "High"
                win_prob = round(min(94.0, 65.0 + (margin * 0.6)), 1)

            constituencies.append({
                "id": cid,
                "uid": cid_counter,
                "name": name,
                "state": state_name,
                "state_code": state_code,
                "electors": 1400000 + (num * 15432) % 600000,
                "demographic_type": demo,
                "literacy_rate": lit,
                "winner_2019": p_win if margin > 6 else p_run,
                "margin_pct_2019": round(margin + 1.8, 1),
                "turnout_2019": t19,
                "winner_2024": p_win,
                "margin_pct_2024": margin,
                "turnout_2024": t24,
                "leading_party": p_win,
                "runner_up_party": p_run,
                "projected_vote_share_lead": round(win_prob * 0.68, 1),
                "projected_vote_share_runner": round((100 - win_prob * 0.68) * 0.72, 1),
                "win_probability": win_prob,
                "predicted_margin": margin,
                "risk_level": risk,
                "confidence": conf,
                "key_issues": ["Employment", "Infrastructure", "Cost of Living"],
                "past_swing": round(t24 - t19, 1),
                "historical_winner_2014": p_win if (num % 2 == 0) else p_run
            })
            created_for_state += 1
            cid_counter += 1

    # Total seats check
    print(f"Generated {len(constituencies)} Lok Sabha constituencies across {len(STATES_SEATS)} states/UTs.")
    print(f"Generated {len(candidates)} detailed candidate profiles.")

    os.makedirs("backend/data", exist_ok=True)
    with open("backend/data/constituencies.json", "w") as f:
        json.dump(constituencies, f, indent=2)
    with open("backend/data/candidates.json", "w") as f:
        json.dump(candidates, f, indent=2)

if __name__ == "__main__":
    build_data()
