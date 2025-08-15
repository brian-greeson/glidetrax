import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';

const TrackReplay = ({ tracks, onBackToUpload }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const deckOverlayRef = useRef(null);
  const animationRef = useRef(null);
  const wallClockStartRef = useRef(0); // wall-clock ms when the current segment started
  const trackStartMsRef = useRef(0); // track time (ms) at the moment the current segment started
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPosition, setCurrentPosition] = useState({});

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        // Use Maptiler hosted glyphs that are publicly available without an API key
        // This avoids 404s from the demo glyph server when many font stacks are requested
        glyphs: 'https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [0, 0],
      zoom: 2,
      pitch: 45,
      bearing: 0,
      maxPitch: 85,
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Wait for map to load
    map.on('load', () => {
      // Set initial view based on tracks
      if (tracks.length > 0) {
        const bounds = calculateBounds(tracks);
        if (bounds.west !== bounds.east && bounds.south !== bounds.north) {
          map.fitBounds(
            [
              [bounds.west, bounds.south],
              [bounds.east, bounds.north],
            ],
            {
              padding: 50,
              duration: 1000,
            }
          );
        }
      }

      // Initialize Deck.gl overlay for true 3D rendering using altitude (z)
      if (!deckOverlayRef.current) {
        const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
        map.addControl(overlay);
        deckOverlayRef.current = overlay;
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        if (deckOverlayRef.current) {
          try {
            mapRef.current.removeControl(deckOverlayRef.current);
          } catch (_) {}
          deckOverlayRef.current = null;
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tracks]);

  // Calculate bounds for all tracks
  const calculateBounds = useCallback((tracks) => {
    if (!tracks || tracks.length === 0) {
      return { west: -180, south: -90, east: 180, north: 90 };
    }

    let minLat = 90,
      maxLat = -90,
      minLon = 180,
      maxLon = -180;

    tracks.forEach((track) => {
      if (track.coordinates && track.coordinates.length > 0) {
        track.coordinates.forEach((coord) => {
          if (
            coord &&
            typeof coord.latitude === 'number' &&
            typeof coord.longitude === 'number'
          ) {
            minLat = Math.min(minLat, coord.latitude);
            maxLat = Math.max(maxLat, coord.latitude);
            minLon = Math.min(minLon, coord.longitude);
            maxLon = Math.max(maxLon, coord.longitude);
          }
        });
      }
    });

    return { west: minLon, south: minLat, east: maxLon, north: maxLat };
  }, []);

  // Add tracks to the map
  useEffect(() => {
    console.log('=== TRACK PROCESSING START ===');
    console.log('Map ref exists:', !!mapRef.current);
    console.log('Map style loaded:', mapRef.current?.isStyleLoaded());
    console.log('Tracks count:', tracks.length);

    // Debug track structure
    tracks.forEach((track, index) => {
      console.log(`Track ${index} structure:`, {
        name: track.name,
        id: track.id,
        pilotName: track.pilotName,
        coordinatesCount: track.coordinates?.length,
        timestampsCount: track.timestamps?.length,
        duration: track.duration,
        color: track.color,
        coordinates: track.coordinates?.slice(0, 3), // First 3 coordinates
        timestamps: track.timestamps?.slice(0, 3), // First 3 timestamps
      });

      // Deep debug of first coordinate
      if (track.coordinates && track.coordinates.length > 0) {
        console.log(`Track ${index} first coordinate details:`, {
          hasTimestamp: !!track.coordinates[0].timestamp,
          timestampType: typeof track.coordinates[0].timestamp,
          timestampValue: track.coordinates[0].timestamp,
          latitude: track.coordinates[0].latitude,
          longitude: track.coordinates[0].longitude,
        });
      }
    });

    // Wait for map to be ready
    if (!mapRef.current) {
      console.log('Map ref not ready, waiting...');
      return;
    }

    if (!mapRef.current.isStyleLoaded()) {
      console.log('Map style not loaded, waiting...');
      // Wait for map to load using the map's load event
      const handleMapLoad = () => {
        console.log('Map style now loaded, processing tracks...');
        // Process tracks now that map is ready
        processTracksInternal();
      };

      if (mapRef.current.loaded()) {
        console.log('Map already loaded, processing tracks...');
        processTracksInternal();
      } else {
        mapRef.current.once('load', handleMapLoad);
      }
      return;
    }

    // If we get here, map is ready, process tracks
    processTracksInternal();
  }, [tracks]);

  // Internal function to process tracks once map is ready
  const processTracksInternal = useCallback(() => {
    console.log('=== PROCESSING TRACKS FUNCTION CALLED ===');
    if (!mapRef.current) {
      console.log('No map ref in processTracks');
      return;
    }
    if (tracks.length === 0) {
      console.log('No tracks in processTracks');
      return;
    }

    console.log('=== PROCESSING TRACKS ===');
    const map = mapRef.current;

    if (tracks.length === 0) {
      console.log('No tracks to process');
      return;
    }

    // Calculate total duration from timestamps
    let maxDuration = 0;
    // Add each track
    tracks.forEach((track, trackIndex) => {
      console.log(`=== PROCESSING TRACK ${trackIndex + 1} ===`);
      console.log('Track name:', track.name);
      console.log('Track ID:', track.id);
      console.log('Original coordinates count:', track.coordinates?.length);

      const trackId = `track-${track.id}`;
      const labelId = `label-${track.id}`;
      const headId = `head-${track.id}`;

      // Create timestamps FIRST from original coordinates (before any processing)
      console.log('Creating timestamps from original coordinates...');
      console.log(
        'Sample of first 3 original coordinates:',
        track.coordinates.slice(0, 3)
      );

      // Ensure we're working with the original coordinates that have timestamps
      const originalCoordinates = track.coordinates || [];
      const timestamps = originalCoordinates
        .filter(
          (coord) =>
            coord &&
            typeof coord.longitude === 'number' &&
            typeof coord.latitude === 'number' &&
            coord.timestamp
        )
        .map((coord) => {
          const timestamp = coord.timestamp;
          console.log(
            'Processing timestamp:',
            timestamp,
            'Type:',
            typeof timestamp
          );
          if (timestamp instanceof Date) {
            return timestamp.getTime();
          } else if (typeof timestamp === 'string') {
            return new Date(timestamp).getTime();
          } else if (typeof timestamp === 'number') {
            return timestamp;
          }
          return null;
        })
        .filter((timestamp) => timestamp !== null);

      console.log('Timestamps count:', timestamps.length);
      if (timestamps.length > 0) {
        console.log('First timestamp:', timestamps[0]);
        console.log('Last timestamp:', timestamps[timestamps.length - 1]);
      } else {
        console.error('No valid timestamps created!');
        console.error(
          'Original coordinates sample:',
          originalCoordinates.slice(0, 3)
        );
      }

      // Create track line coordinates (3D: [lon, lat, altitude])
      console.log('Filtering coordinates...');
      const coordinates = track.coordinates
        .filter(
          (coord) =>
            coord &&
            typeof coord.longitude === 'number' &&
            typeof coord.latitude === 'number'
        )
        .map((coord) => [coord.longitude, coord.latitude, coord.altitude ?? 0]);

      console.log('Filtered coordinates count:', coordinates.length);
      if (coordinates.length > 0) {
        console.log('First coordinate:', coordinates[0]);
        console.log('Last coordinate:', coordinates[coordinates.length - 1]);
      }

      if (coordinates.length === 0) return;

      // Deck.gl will handle 3D rendering; skip adding MapLibre 2D line source
      console.log('Skipping MapLibre line source. Using deck.gl overlay.');

      // Skip adding MapLibre 2D line layer

      // Skip adding MapLibre 2D head source; deck.gl will render a 3D dot

      // Skip adding MapLibre 2D head layer

      // Skip adding MapLibre label source; deck.gl TextLayer will be used

      // Skip adding MapLibre symbol layer

      // Store reference for animation
      track.trackId = trackId;
      track.labelId = labelId;
      track.coordinates = coordinates;
      track.timestamps = timestamps;
      track.headId = headId;

      console.log('Track processing complete:');
      console.log('  - Track ID:', trackId);
      console.log('  - Label ID:', labelId);
      console.log('  - Coordinates count:', coordinates.length);
      console.log('  - Timestamps count:', timestamps.length);
      console.log('  - Color:', track.color);
    });

    // Now that each track has timestamps, compute total duration
    maxDuration = 0;
    console.log('=== DURATION CALCULATION (POST-BUILD) ===');
    tracks.forEach((track) => {
      if (track.timestamps && track.timestamps.length > 1) {
        const trackDuration =
          track.timestamps[track.timestamps.length - 1] - track.timestamps[0];
        console.log(`Track ${track.name} duration:`, trackDuration, 'ms');
        maxDuration = Math.max(maxDuration, trackDuration);
      }
    });
    console.log('Final max duration:', maxDuration, 'ms');
    setTotalDuration(maxDuration);

    // Render initial state on overlay
    try {
      updatePositions(0);
    } catch (e) {
      console.error('Failed initial overlay render', e);
    }

    // Cleanup function
    return () => {
      tracks.forEach((track) => {
        if (track.trackId && map.getLayer(track.trackId)) {
          map.removeLayer(track.trackId);
        }
        if (track.labelId && map.getLayer(track.labelId)) {
          map.removeLayer(track.labelId);
        }
        if (track.headId && map.getLayer(track.headId)) {
          map.removeLayer(track.headId);
        }
        if (track.trackId && map.getSource(track.trackId)) {
          map.removeSource(track.trackId);
        }
        if (track.labelId && map.getSource(track.labelId)) {
          map.removeSource(track.labelId);
        }
        if (track.headId && map.getSource(track.headId)) {
          map.removeSource(track.headId);
        }
      });
    };
  }, [tracks]);

  // Animation loop
  useEffect(() => {
    if (!mapRef.current) return;
    if (totalDuration <= 0) return;

    if (!isPlaying) return;

    // capture start references so speed changes don't jump backward
    wallClockStartRef.current = Date.now();
    trackStartMsRef.current = currentTime * 1000;

    const animate = () => {
      if (!isPlaying) return;

      const elapsedWall = Date.now() - wallClockStartRef.current; // in ms
      const newTimeMs = Math.min(
        trackStartMsRef.current + elapsedWall * playbackSpeed,
        totalDuration
      );

      setCurrentTime(newTimeMs / 1000);
      updatePositions(newTimeMs);

      if (newTimeMs < totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Update pilot positions during replay
  const updatePositions = useCallback(
    (elapsedTime) => {
      if (!mapRef.current) return;

      const deckLayers = [];
      tracks.forEach((track) => {
        const { coordinates, timestamps, labelId, trackId } = track;

        // Safety check for required properties
        if (
          !coordinates ||
          !timestamps ||
          !labelId ||
          timestamps.length === 0
        ) {
          return;
        }

        // Find current position based on elapsed time
        let currentIndex = 0;
        for (let i = 0; i < timestamps.length; i++) {
          if (timestamps[i] - timestamps[0] <= elapsedTime) {
            currentIndex = i;
          } else {
            break;
          }
        }

        if (coordinates[currentIndex]) {
          const pathPositions = coordinates.slice(0, currentIndex + 1);
          const hex = track.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 255;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;

          deckLayers.push(
            new PathLayer({
              id: `${trackId}-path`,
              data: [{ path: pathPositions }],
              getPath: (d) => d.path,
              getColor: [r, g, b, 200],
              widthUnits: 'pixels',
              getWidth: 3,
            })
          );

          deckLayers.push(
            new ScatterplotLayer({
              id: `${trackId}-head`,
              data: [coordinates[currentIndex]],
              getPosition: (d) => d,
              getFillColor: [r, g, b, 255],
              radiusUnits: 'pixels',
              getRadius: 6,
              stroked: true,
              getLineColor: [255, 255, 255, 255],
              lineWidthUnits: 'pixels',
              getLineWidth: 2,
            })
          );

          deckLayers.push(
            new TextLayer({
              id: `${trackId}-label`,
              data: [
                { position: coordinates[currentIndex], text: track.pilotName },
              ],
              getPosition: (d) => d.position,
              getText: (d) => d.text,
              getSize: 14,
              getColor: [255, 255, 255, 255],
              background: true,
              getBackgroundColor: [0, 0, 0, 180],
              billboard: true,
            })
          );

          // Update current position for display
          setCurrentPosition((prev) => ({
            ...prev,
            [track.id]: {
              pilot: track.pilotName,
              position: currentIndex + 1,
              total: coordinates.length,
            },
          }));
        }
      });

      if (deckOverlayRef.current) {
        deckOverlayRef.current.setProps({ layers: deckLayers });
      }
    },
    [tracks]
  );

  // Playback controls
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsPlaying(true);
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset deck overlay to start
    updatePositions(0);
    setCurrentPosition({});
  };

  const seekTo = (percent) => {
    if (totalDuration <= 0) return;
    const clamped = Math.max(0, Math.min(100, percent));
    const newTime = (clamped / 100) * totalDuration;
    setCurrentTime(newTime / 1000);
    // When seeking, pause animation and update instantly
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    updatePositions(newTime);
    // If currently playing, re-anchor the timing so playback continues smoothly
    if (isPlaying) {
      wallClockStartRef.current = Date.now();
      trackStartMsRef.current = newTime;
      animationRef.current = requestAnimationFrame(() => {
        // kick the loop once; the effect will continue handling frames
        const elapsedWall = Date.now() - wallClockStartRef.current;
        const newTimeMs = Math.min(
          trackStartMsRef.current + elapsedWall * playbackSpeed,
          totalDuration
        );
        setCurrentTime(newTimeMs / 1000);
        updatePositions(newTimeMs);
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='w-full h-full relative'>
      {/* MapLibre Container */}
      <div ref={mapContainerRef} className='w-full h-full' />

      {/* Controls Overlay */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 min-w-80'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Replay Controls
          </h3>
          <button
            onClick={onBackToUpload}
            className='text-gray-600 hover:text-gray-800 p-2'
            title='Back to upload'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
              />
            </svg>
          </button>
        </div>

        {/* Playback Controls */}
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <button
              onClick={togglePlay}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500'
            >
              Reset
            </button>
          </div>

          {/* Progress Bar */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm text-gray-600'>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration / 1000)}</span>
            </div>
            <input
              type='range'
              min='0'
              max='100'
              value={
                totalDuration > 0
                  ? (currentTime / (totalDuration / 1000)) * 100
                  : 0
              }
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
            />
          </div>

          {/* Speed Control */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Playback Speed
            </label>
            <input
              type='range'
              min='0.5'
              max='10'
              step='0.5'
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
            />
            <div className='text-sm text-gray-600'>{playbackSpeed}x</div>
          </div>
        </div>

        {/* Current Positions */}
        {Object.keys(currentPosition).length > 0 && (
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <h4 className='text-sm font-medium text-gray-700 mb-2'>
              Current Positions
            </h4>
            <div className='space-y-1'>
              {Object.entries(currentPosition).map(([trackId, info]) => (
                <div key={trackId} className='text-xs text-gray-600'>
                  {info.pilot}: {info.position}/{info.total}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Track Legend */}
      <div className='absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>Tracks</h3>
        <div className='space-y-2'>
          {tracks.map((track) => (
            <div key={track.id} className='flex items-center space-x-2'>
              <div
                className='w-4 h-4 rounded-full'
                style={{ backgroundColor: track.color }}
              ></div>
              <span className='text-sm text-gray-700'>{track.pilotName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackReplay;
