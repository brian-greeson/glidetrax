# GlideTrax - 3D GPS Track Replay

A modern web application that creates 3D replays of GPS tracklogs from IGC files. Built with React, MapLibre GL, deck.gl, and Tailwind CSS.
[Demo available](https://octopus-app-7nwzz.ondigitalocean.app)
<p>
<img width="600" alt="image" src="https://github.com/user-attachments/assets/aa0237db-6b04-40f0-8898-c14d8026a97b" />
<img width="600" alt="image" src="https://github.com/user-attachments/assets/6f9f1114-4d10-4fa8-b5e3-e0cfeb2dde0d" />
</p>p>


## Features

- **File Upload**: Drag & drop or browse for IGC files
- **IGC Parsing**: Extracts GPS coordinates, altitude, and pilot names
- **3D Tracks**: True 3D flight paths rendered with deck.gl
- **Multi-Track Support**: Upload and replay multiple tracks simultaneously
- **Editable Pilot Names**: Edit pilot names extracted from files or add custom ones
- **Replay Controls**: Play, pause, reset, and seek through tracks
- **Speed Control**: Adjustable playback speed from 0.5x to 10x
- **Mobile Friendly**: Responsive design that works on all devices

## Supported Formats

- .IGC

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd glidetrax
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## Usage

### Uploading Files

1. Drag and drop IGC files onto the drop zone, or click to browse
2. Files are automatically parsed and displayed in a list
3. Edit pilot names if needed
4. Click "Create 3D Replay" to start the visualization

### 3D Replay Controls

- **Play/Pause**: Start or stop the replay
- **Reset**: Return to the beginning of all tracks
- **Progress Bar**: Seek to any point in the replay
- **Speed Control**: Adjust playback speed from 0.5x to 10x
- **Track Legend**: View all uploaded tracks with color coding

### Navigation

- **Mouse**: Rotate, pan, and zoom the 3D view
- **Touch**: Swipe and pinch gestures on mobile devices
- **Auto-positioning**: Camera automatically focuses on track bounds

## Technical Details

### Architecture

- **Frontend**: React 18 with functional components and hooks
- **Map Engine**: MapLibre GL for base map, camera, and 3D terrain
- **Overlays**: deck.gl for the animated 3D track line, head marker, and labels
- **Styling**: Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development and building


## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── components/          # React components
│   ├── FileUpload.jsx  # File upload interface
│   └── TrackReplay.jsx # 3D replay component
├── utils/              # Utility functions
│   └── igcParser.js    # IGC file parser
├── App.jsx             # Main app component
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


