# Backend Formulas Explained (Hinglish)

Yeh document Project Sentinel ke backend mein use hone wale sabhi important formulas aur calculations ko Hinglish mein explain karta hai.

---

## 1. Data Aggregation (Data ko Ikhatta Karna)

Dashboard par data dikhane ke liye, alag-alag sources se data ko har village ke liye combine kiya jaata hai. Yeh data `HealthReport` (ASHA workers se), `ClinicReport` (clinics se), aur `NgoSurvey` (NGOs se) se aata hai.

-   **Symptom Counting (`symptom_counter`)**: Har report se symptoms (jaise 'fever', 'diarrhea', 'vomiting') ko count kiya jaata hai. Yeh data "Symptom Distribution" bar chart mein use hota hai.

-   **Severity Counting (`severity_counter`)**: `HealthReport` se "Mild," "Moderate," aur "Severe" cases ki ginti ki jaati hai.

-   **Total Cases (`total_cases`)**: Total cases in sab ko jod kar nikale jaate hain:
    1.  Saare `HealthReport` ka count.
    2.  `ClinicReport` mein diye gaye `typhoid_cases`, `fever_cases`, etc.
    3.  `NgoSurvey` mein diye gaye cases.

---

## 2. Risk Score Calculation (Khatre ka Level Kaise Calculate Hota Hai)

Har village ko ek `risk_percentage` diya jaata hai, jisse uska overall health status pata chalta hai.

### Current Risk Formula
```
risk_percentage = (0.6 * severity_score) + (0.3 * case_score) + water_penalty + untreated_penalty
```

Iske 4 main hisse hain:

#### a. `severity_score` (60% Weight)
-   **Yeh kya hai?**: Cases kitne serious hain, uska score (0-100).
-   **Kaise kaam karta hai?**: "Severe" case ko 3x, "Moderate" ko 2x, aur "Mild" ko 1x weight (importance) di jaati hai. Isse ek normalized score banta hai.
-   **Asar**: Yeh risk ka sabse bada factor hai, jo final score ka 60% hissa cover karta hai.

#### b. `case_score` (30% Weight)
-   **Yeh kya hai?**: Village mein total cases ke number par based ek score (0-100).
-   **Kaise kaam karta hai?**: Iska formula hai `min(100, (total_cases / 20) * 100)`.
-   **Problem**: Yahan threshold **20 cases** hai. Iska matlab hai ki 20 se zyada case hote hi yeh score 100 ho jaata hai, aur final risk mein hamesha 30 points (`0.3 * 100`) jod deta hai. Isliye aapko zyada "High Risk" villages dikh rahe hain.

#### c. `water_penalty` (+20 Points)
-   **Yeh kya hai?**: Saaf paani na hone par lagne wali penalty.
-   **Kaise kaam karta hai?**: Agar NGO survey mein `clean_drinking_water` ki value `False` (matlab saaf paani nahi hai) hoti hai, to final score mein seedhe **20 points** jud jaate hain.

#### d. `untreated_penalty` (+15 Points)
-   **Yeh kya hai?**: Ilaaj na milne par lagne wali penalty.
-   **Kaise kaam karta hai?**: Agar kisi rule-based alert mein "untreated" jaisa shabd aata hai, to score mein **15 points** aur jud jaate hain.

### Final `risk_level`
Final `risk_percentage` ke basis par, village ko in categories mein daala jaata hai:
-   `> 90`: "Very High"
-   `> 60`: "High"
-   `> 40`: "Moderate"
-   `> 20`: "Low"
-   `<= 20`: "Very Low"

---

## 3. Other Calculations (Dusre Calculations)

-   **Severity Distribution (Pie Chart)**: `severity_counter` (Mild, Moderate, Severe ki ginti) ko percentage (%) mein convert kiya jaata hai, jo aapko dashboard par pie chart mein dikhta hai.

-   **Monthly Trend (Line Chart)**: Pichle 6 mahino ke case counts ko har mahine ke hisaab se group kiya jaata hai, jisse line chart banta hai.

---

## 4. Prediction Formulas

Prediction se related formulas `prediction` app ke andar hain. Unki analysis karke unki explanation jald hi is file mein add kar di jaayegi.
