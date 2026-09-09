# Fast Send - Official Website & Google Play Compliance Portal

This directory contains the complete, production-ready marketing website, technical documentation, and Google Play Store legal compliance pages for **Fast Send**.

---

## 📁 File Structure

```
website/
├── index.html              # Main landing page (features, how it works, architecture, FAQ)
├── privacy.html            # Google Play-compliant Privacy Policy (Biometrics, Permissions, Cloud Security)
├── terms.html              # Terms of Service & Acceptable Use Policy
├── data-deletion.html      # Mandatory Google Play User & Biometric Data Deletion Portal
├── README.md               # Deployment and Google Play submission guide
├── css/
│   └── styles.css          # Neobrutalist design system (Nunito, Brand Yellow, Bold Borders)
├── js/
│   └── main.js             # Mobile drawer navigation, FAQ accordions, deletion form
└── assets/                 # High-resolution logos, app icons, and illustrations
    ├── icon.png
    ├── favicon.png
    └── images/
```

---

## 📋 Google Play Store Developer Console URLs

When setting up your app in the **Google Play Console**, use these URL endpoints once deployed:

| Field in Google Play Console | URL Path to Provide |
| :--- | :--- |
| **Store Listing Website** | `https://your-domain.com/` |
| **Privacy Policy URL** | `https://your-domain.com/privacy.html` |
| **Data Deletion URL** | `https://your-domain.com/data-deletion.html` |
| **Support Email** | `support@fastsend.app` (or `sshaiy2255@gmail.com`) |

---

## 🚀 How to Preview Locally

Because this website uses pure, modern HTML5, CSS3, and JavaScript with zero external build dependencies:

1. **Option 1 (Instant):**  
   Simply double-click `index.html` to open it in Chrome, Edge, Safari, or Firefox!

2. **Option 2 (Local Web Server):**  
   Open a terminal in the `website` folder and run:
   ```bash
   python -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

---

## 🌐 How to Deploy (Free in 2 Minutes)

### Option A: Vercel (Recommended)
1. Install the Vercel CLI (if not already installed): `npm i -g vercel`
2. In the terminal, navigate to this `website` directory:
   ```bash
   cd "F:\abubakar data\python journey\.net projects\Fast Send\website"
   vercel
   ```
3. Follow the 3 prompts. You will receive an instant, live HTTPS URL (e.g. `https://fast-send.vercel.app`)!

### Option B: Netlify
1. Go to [netlify.com](https://www.netlify.com).
2. Drag and drop the `website` folder directly into Netlify's web dashboard.
3. It will give you a free, permanent HTTPS URL.

### Option C: GitHub Pages
1. Push this folder to a GitHub repository.
2. In the repository settings, enable **GitHub Pages** pointing to the branch root.
