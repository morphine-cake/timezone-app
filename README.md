# ⏰ Kairos - Find the perfect time

A beautiful, responsive timezone web application that helps you find the perfect time across multiple cities worldwide. Track local times with automatic location detection and intuitive time comparison.

## ✨ Features

- **🔍 Smart City Search**: Modal interface with autocomplete search and keyboard navigation
- **📍 Auto Location Detection**: Automatically detects your location using GPS and timezone
- **🕐 Real-time Updates**: Times update automatically every minute
- **⏰ Custom Time Mode**: Set any custom time and see corresponding times in other cities
- **💾 Persistent Storage**: Selected cities and recent searches saved in localStorage
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **♿ Accessible**: Built with ARIA attributes and semantic HTML
- **🎨 Modern UI**: Clean, minimal design with uniform 180px city cards

## 🛠️ Technology Stack

### Frontend

- **HTML5**: Semantic structure with accessibility features
- **SCSS**: Variables, nesting, and responsive mixins
- **JavaScript ES6+**: Modern class-based architecture
- **Luxon**: Reliable timezone handling and date formatting
- **CSS Grid & Flexbox**: Responsive layout system

### Backend

- **Node.js**: Server runtime
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **354+ Global Cities**: Comprehensive timezone database

## 📁 Project Structure

```
kairos-timezone-app/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles/
│   │   ├── main.scss       # SCSS styles
│   │   └── main.css        # Compiled CSS
│   └── scripts/
│       └── app.js          # Frontend JavaScript
├── server/
│   ├── data/
│   │   └── cities.json     # 354+ cities with timezone data
│   └── index.js            # Express server
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/morphine-cake/timezone-app.git
   cd timezone-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Compile SCSS**:

   ```bash
   npm run build-css
   ```

4. **Start the server**:

   ```bash
   npm start
   ```

   For development with auto-restart:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📱 Usage

### Adding Cities

1. Click the "Add City" button to open the modal
2. Search for cities using the search box
3. Select from popular cities or recent cities
4. Press Enter or click to add a city

### Custom Time Mode

1. Change the time in the time input field
2. A "Current Time" button appears to return to current time
3. All cities show corresponding times based on your custom reference time

### Location Detection

- Kairos automatically detects your location using GPS coordinates
- Falls back to browser timezone if GPS is unavailable
- Your location serves as the reference for time differences

### Managing Cities

- Click the ✕ button on any city card to remove it
- Recent cities are saved for quick access in future sessions

## 🔧 API Endpoints

### GET /api/cities

Returns list of all 354+ available cities with timezone information.

**Response:**

```json
[
  {
    "id": "new-york",
    "name": "New York",
    "country": "United States",
    "timezone": "America/New_York"
  }
]
```

### GET /api/time?timezone=TIMEZONE

Returns current time for the specified timezone.

**Parameters:**

- `timezone`: IANA timezone identifier (e.g., "America/New_York")

**Response:**

```json
{
  "timezone": "America/New_York",
  "currentTime": "14:30:25",
  "timestamp": 1703168425000,
  "offsetHours": -5,
  "offsetMinutes": -300
}
```

## 🎨 Customization

### Adding More Cities

Edit `server/data/cities.json` to add more cities:

```json
{
  "id": "custom-city",
  "name": "Custom City",
  "country": "Country Name",
  "timezone": "Continent/City"
}
```

### Styling

Modify SCSS variables in `public/styles/main.scss`:

```scss
$primary-color: #your-color;
$font-family: "Your-Font", sans-serif;
```

Then recompile:

```bash
npx sass public/styles/main.scss public/styles/main.css
```

## 🌐 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Luxon](https://moment.github.io/luxon/) for timezone handling
- [Inter Font](https://rsms.me/inter/) for typography
- IANA timezone database for accurate timezone data
- Built with ❤️ for global travelers and remote teams
