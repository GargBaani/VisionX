# 🚀 VisionX – Real-Time Web Accessibility Chrome Extension

VisionX is a Chrome Extension designed to enhance web accessibility in real time for visually impaired and low-vision users, with a strong focus on students and educational content.

It improves readability, fixes contrast issues, simplifies complex layouts, enables text-to-speech, and provides accessibility insights — all without requiring changes to the original website.

---

## ✨ Key Features

### 🎯 Readability Mode

* Replaces hard-to-read fonts with accessible alternatives
* Dynamically increases font size
* Improves line height and spacing
* Adjusts reading width for better focus

---

### 🌗 Auto Contrast Fixer

* Detects low-contrast text areas
* Adjusts foreground/background colors for better visibility
* Preserves overall page aesthetics where possible

---

### 🔊 Text-to-Speech Assistant

* Reads selected text or full page content aloud
* Supports play, pause, resume, and stop controls
* Highlights currently spoken content (where supported)

---

### 🧭 Simplified Reading Mode

* Extracts main content from webpage
* Removes clutter (ads, sidebars, distractions)
* Displays content in a clean reader-style layout

---

### 🧠 Accessibility Scanner

* Scans webpage using `axe-core`
* Generates accessibility score
* Lists detected issues
* Provides actionable fix suggestions

---

## 🎯 Why VisionX?

Many websites are not designed with accessibility in mind, making them difficult to use for people with low vision or reading difficulties.

VisionX solves this by applying **instant, real-time accessibility improvements** without requiring developers to rebuild their websites.

### 👥 Ideal Use Cases

* Students reading online study material
* Educational platforms and documentation
* Users needing larger text, better contrast, or voice support
* Developers performing quick accessibility checks

---

## 🛠️ Tech Stack

### Frontend (Extension)

* React
* TypeScript
* Tailwind CSS
* Chrome Extension (Manifest V3)

### Core Tools

* axe-core (accessibility scanning)
* Web Speech API (Text-to-Speech)
* Chrome Storage API

### Build Tools

* esbuild

---

## 📂 Project Structure

```bash
visionx/
├── dist/                 # Production build (load this in Chrome)
├── scripts/              # Build scripts
├── src/
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts
│   │   └── features/     # Readability, contrast, reader mode, TTS, scanner
│   ├── popup/            # Extension popup UI
│   ├── report/           # Accessibility report page
│   ├── shared/           # Shared logic, types, messaging
│   ├── styles/           # Tailwind styles
│   └── manifest.json
├── package.json
└── tsconfig.json
```

---

## ⚙️ Installation & Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

---

### 2️⃣ Build the Extension

```bash
npm run build
```

---

### 3️⃣ Load in Chrome

1. Open: `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

---

## 🚀 Usage

1. Open any website

2. Click the VisionX extension icon

3. Use popup controls to:

   * Enable readability mode
   * Adjust font size, spacing, and width
   * Apply contrast fixes
   * Activate reader mode
   * Control text-to-speech
   * Run accessibility scan

4. View detailed results in the **report dashboard**

---

## 🧪 MVP Scope

This version includes:

* Chrome Extension popup UI
* Persistent user settings
* Live DOM-based readability improvements
* Rule-based contrast correction
* Reader mode overlay
* Text-to-speech support
* Accessibility scanning via axe-core

---

## ⚠️ Limitations

* Some highly dynamic or protected websites may not fully respond
* Contrast adjustments are heuristic-based
* Reader mode accuracy depends on content extraction logic
* AI-based summarization and alt-text generation not included in MVP

---

## 🔮 Future Enhancements

* AI-powered text simplification
* AI-generated image alt text
* Multilingual support
* Exportable accessibility reports
* Personalized accessibility profiles
* Student-focused “Study Mode”

---

## 🧑‍💻 Development

### Type Check

```bash
npm run typecheck
```

### Build After Changes

```bash
npm run build
```

---

## 🎯 Project Vision

VisionX aims to make the web more readable, understandable, and accessible — without waiting for every website to implement accessibility standards on their own.

---

## 📄 License

MIT

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!
<img width="500" height="472" alt="image" src="https://github.com/user-attachments/assets/eb89302a-9ab5-4b0b-85e0-028536a458b3" />
<img width="484" height="550" alt="image" src="https://github.com/user-attachments/assets/a5a9555b-5904-4b3d-8e50-e73ef8d0260c" />
<img width="495" height="746" alt="image" src="https://github.com/user-attachments/assets/38c1e913-14c8-43ed-813c-3adce0121642" />
<img width="474" height="210" alt="image" src="https://github.com/user-attachments/assets/97f87b0b-0013-43ef-af96-b49426aeeb17" />



