// IGC File Parser using the official igc-parser package
import IGCParser from 'igc-parser';

export function parseIGCFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;

        // Use the official igc-parser package
        const result = IGCParser.parse(content, { lenient: true });
        console.log('IGC Parser result:', result);
        console.log('Fixes count:', result?.fixes?.length);
        console.log('Sample fix:', result?.fixes?.[0]);

        if (!result || !result.fixes || result.fixes.length === 0) {
          reject(new Error('No valid track points found in IGC file'));
          return;
        }

        // Extract pilot name from header
        let pilotName = 'Unknown Pilot';
        if (result.pilot) {
          pilotName = result.pilot;
        }

        // Convert fixes to our track format
        const coordinates = result.fixes
          .filter((fix) => fix.valid && fix.latitude && fix.longitude)
          .map((fix) => ({
            timestamp: new Date(fix.timestamp),
            latitude: fix.latitude,
            longitude: fix.longitude,
            altitude: fix.gpsAltitude || fix.pressureAltitude || 0,
            time: fix.time,
          }));

        if (coordinates.length === 0) {
          reject(new Error('No valid GPS coordinates found in IGC file'));
          return;
        }

        // Calculate duration from timestamps
        const startTime = coordinates[0].timestamp;
        const endTime = coordinates[coordinates.length - 1].timestamp;
        const duration = endTime.getTime() - startTime.getTime();

        const track = {
          id: generateTrackId(),
          name: file.name,
          pilotName: pilotName,
          coordinates: coordinates,
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          color: generateRandomColor(),
          file: file,
          // Store additional parsed data for potential future use
          parsedData: result,
        };

        console.log('Final track object:', track);
        console.log('Sample coordinate:', coordinates[0]);
        console.log('Coordinate has timestamp:', !!coordinates[0]?.timestamp);

        resolve(track);
      } catch (error) {
        reject(new Error(`Failed to parse IGC file: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function generateTrackId() {
  return 'track_' + Math.random().toString(36).substr(2, 9);
}

function generateRandomColor() {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#EC4899', // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
