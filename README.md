# GlideTrax - 3D GPS Track Replay

A modern web application that creates 3D replays of GPS tracklogs from IGC files. Built with React, Cesium 3D mapping, and Tailwind CSS.

## Features

- **File Upload**: Drag & drop or browse for IGC files
- **IGC Parsing**: Extracts GPS coordinates, altitude, and pilot names
- **3D Terrain**: High-quality 3D terrain visualization using Cesium
- **Multi-Track Support**: Upload and replay multiple tracks simultaneously
- **Editable Pilot Names**: Edit pilot names extracted from files or add custom ones
- **Replay Controls**: Play, pause, reset, and seek through tracks
- **Speed Control**: Adjustable playback speed from 0.5x to 10x
- **Mobile Friendly**: Responsive design that works on all devices
- **Real-time Tracking**: Pilot names displayed above current positions during replay

## Supported Formats

- **IGC (.igc)**: International Gliding Commission format
  - Extracts GPS coordinates (latitude/longitude)
  - Parses altitude data (GPS and pressure)
  - Reads pilot name from `HFPLTPILOTINCHARGE` header

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
- **3D Engine**: Cesium.js for high-performance 3D mapping
- **Styling**: Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development and building

### IGC Parsing

The app parses IGC B-records to extract:

- **Time**: HHMMSS format converted to timestamps
- **Coordinates**: DDMMmmm format converted to decimal degrees
- **Altitude**: GPS altitude (preferred) or pressure altitude
- **Pilot Name**: Extracted from HFPLTPILOTINCHARGE header

### Performance Features

- Efficient coordinate parsing and storage
- Optimized 3D rendering with Cesium
- Responsive UI that works on mobile devices
- Memory-efficient track management

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

### Adding New Features

- **File Formats**: Extend `igcParser.js` for additional formats
- **3D Features**: Add new Cesium entities in `TrackReplay.jsx`
- **UI Components**: Create new components in the `components/` directory

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Requirements**: WebGL support for 3D rendering

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Future Enhancements

- **Video Export**: Save replays as video files
- **Performance Optimization**: Handle very long tracks efficiently
- **Additional Formats**: Support for GPX, KML, and other GPS formats
- **Advanced Analytics**: Track statistics and performance metrics
- **Social Features**: Share and compare tracks with other pilots

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Note**: This application requires an internet connection to load Cesium terrain data and map tiles.
