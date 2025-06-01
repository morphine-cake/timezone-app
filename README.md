# 🌍 World Clock - Timezone Web Application

A beautiful, responsive web application that allows users to track local times across multiple cities worldwide and view time differences between them.

## ✨ Features

- **🔍 Smart City Search**: Autocomplete search with keyboard navigation
- **🕐 Real-time Updates**: Times update automatically every minute
- **📍 Reference City**: Set any city as reference to see time differences
- **💾 Persistent Storage**: Selected cities are saved in localStorage
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **♿ Accessible**: Built with ARIA attributes and semantic HTML
- **🎨 Modern UI**: Clean, professional design with smooth animations

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
- **Intl API**: Native timezone validation

## 📁 Project Structure

```
timezone-app/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles/
│   │   └── main.scss       # SCSS styles
│   └── scripts/
│       └── app.js          # Frontend JavaScript
├── server/
│   ├── data/
│   │   └── cities.json     # City and timezone data
│   └── index.js            # Express server
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or create the project**:

   ```bash
   mkdir timezone-app
   cd timezone-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Compile SCSS (optional for development)**:

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

1. Type in the search box to find cities
2. Use arrow keys to navigate suggestions
3. Press Enter or click to add a city
4. The first city becomes the reference automatically

### Managing Time Differences

1. Select a reference city from the dropdown
2. Other cities will show time differences relative to the reference
3. Reference city is marked with a 📍 pin icon

### Removing Cities

- Click the ✕ button on any city card to remove it
- If you remove the reference city, another city becomes the reference

## 🔧 API Endpoints

### GET /api/cities

Returns list of all available cities with timezone information.

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

---

Built with ❤️ for global travelers and remote teams!
