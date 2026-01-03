import { PageHelpProps } from './components/PageHelp';

export const overviewHelpConfig: PageHelpProps = {
  title: 'Bird Activity Dashboard',
  description:
    'View real-time and daily statistics about bird activity at your feeder. This dashboard provides key metrics, current weather conditions, and a 24-hour activity pattern visualization.',
  details: [
    {
      title: 'Activity Statistics',
      content:
        'Track unique bird species visits, total detections, and last hour activity. The system counts both video and audio detections, distinguishing between different species using computer vision and audio analysis.',
    },
    {
      title: 'Visit Metrics',
      content:
        'Monitor average visit duration and identify the busiest hour of bird activity. The system considers a continuous period of detections as a single visit, helping understand bird feeding patterns.',
    },
    {
      title: 'Audio/Video Ratio',
      content:
        'Shows the proportion of birds detected through audio versus video. A ratio less than 1 means more video detections, while greater than 1 indicates more audio detections. This helps evaluate detector performance.',
    },
    {
      title: 'Weather Information',
      content:
        'Current weather conditions that may affect bird activity, including temperature, cloud cover, humidity, and wind speed. Weather data is automatically updated and stored with each detection.',
    },
    {
      title: 'Daily Activity Pattern',
      content:
        'A 24-hour circular visualization showing when different species visit the feeder. The chart uses color-coding to distinguish between species, with the length of each segment indicating the number of detections.',
    },
    {
      title: 'Date Selection',
      content:
        'Use the date picker to view historical data for any specific day. This allows you to track patterns over time and compare activity levels across different dates.',
    },
  ],
  dialogMaxWidth: 'md',
} as const;

export const foodHelpConfig: PageHelpProps = {
  title: 'Bird Food Management',
  description:
    'Manage and track different types of food available in your bird feeder. The system uses this information to analyze which foods attract specific bird species.',
  details: [
    {
      title: 'Food Selection',
      content:
        'Toggle which types of food are currently available in your feeder. Active foods will be associated with bird visits and help build feeding pattern data.',
    },
    {
      title: 'Food Catalog',
      content:
        'A comprehensive list of common bird foods with details about which species they typically attract. Each food type includes an image, description, and recommended usage.',
    },
    {
      title: 'Usage Analytics',
      content:
        'The system tracks which foods are present during bird visits, helping you understand which foods are most effective at attracting specific species.',
    },
    {
      title: 'Active Status',
      content:
        'Use the checkboxes to indicate which foods are currently in your feeder. Only active foods will be associated with new bird detections.',
    },
    {
      title: 'Food Information',
      content:
        'Each food entry includes:\n- Name and image for easy identification\n- Detailed description of the food type\n- List of bird species commonly attracted to this food\n- Special handling or storage recommendations',
    },
    {
      title: 'Food Effectiveness',
      content:
        'Through the bird detection system, you can track which foods are most successful at attracting your target species. This data helps optimize your feeding strategy.',
    },
  ],
  dialogMaxWidth: 'md',
} as const;

export const timelineHelpConfig: PageHelpProps = {
  title: 'Timeline',
  description:
    'View chronological history of bird visits to your feeder. Each visit shows detailed information about detected birds, including both video and audio observations.',
  details: [
    {
      title: 'Visit Controls',
      content:
        'Filter and navigate visits using:\n- Date/time picker to select viewing period\n- Species dropdown to filter by specific bird types\n- Summary statistics showing unique species count, total visits, and total duration',
    },
    {
      title: 'Visit Information',
      content:
        'Each visit card displays:\n- Bird species with image and name\n- Number of birds seen simultaneously (shown with person icon)\n- Visit duration in seconds (shown with clock icon)\n- Temperature during the visit (shown with thermometer icon)\n- Expandable view for detailed detection timeline',
    },
    {
      title: 'Detection Types',
      content:
        'Within each visit, detections are shown with:\n- Video detections (camera icon) - Visual confirmation of birds\n- Audio detections (microphone icon) - Bird calls and songs\n- Confidence percentage for each detection\n- Precise timestamp for every observation\n- Duration in seconds for each detection',
    },
    {
      title: 'Visual Timeline',
      content:
        'The vertical timeline shows:\n- Chronological sequence of visits with time markers\n- Connected dots indicating continuous monitoring\n- Expandable/collapsible visit details\n- Clear separation between different visits',
    },
    {
      title: 'Detection Confidence',
      content:
        'Each detection shows confidence levels:\n- Video detections typically show 95-100% confidence\n- Audio detections may have varying confidence levels\n- Green indicators for high confidence (100%)\n- Blue indicators for good confidence (95% and above)',
    },
    {
      title: 'Weather Context',
      content:
        'Temperature data is recorded for each visit to help correlate bird activity with weather conditions. This helps identify patterns in bird behavior related to environmental factors.',
    },
  ],
  dialogMaxWidth: 'md',
} as const;

export const birdDirHelpConfig: PageHelpProps = {
  title: 'Bird Directory',
  description:
    'Browse and explore all bird species detected by your feeder. The directory organizes birds in a hierarchical tree structure based on their taxonomic classification.',
  details: [
    {
      title: 'Bird Classification',
      content:
        'Birds are organized hierarchically by family and species:\n- Main categories like "Perching Birds", "Cardinals", etc.\n- Species within each family (e.g., Northern Cardinal)\n- Subspecies or age/sex variations when detected (e.g., Adult Male)\nNumbers on the right show detection counts for each group.',
    },
    {
      title: 'Navigation',
      content:
        'Use the expandable tree structure to:\n- Click arrows to expand/collapse categories\n- Click species names to view detailed information\n- External link icons (↗) open species detail pages\n- Numbers show total observations at each level',
    },
    {
      title: 'Filtering',
      content:
        'Use the filter dropdown to customize the view:\n- "Observed" shows only species detected at your feeder\n- "All" shows complete species database including potential visitors\n- Filter helps focus on birds relevant to your location',
    },
    {
      title: 'Detection Counts',
      content:
        'Numbers displayed on the right indicate:\n- Total detections for each species\n- Aggregated counts for family groups\n- Both audio and video detections are included\n- Counts update automatically as new birds are detected',
    },
    {
      title: 'Species Information',
      content:
        'Clicking on a species name provides:\n- Detailed species information\n- Visit history and patterns\n- Audio and video detection statistics\n- Preferred foods based on your feeder data',
    },
    {
      title: 'Taxonomy Structure',
      content:
        'The hierarchical organization helps understand:\n- Bird family relationships\n- Species classifications\n- Common groupings of similar birds\n- Distinction between different age/sex variations of the same species',
    },
  ],
  dialogMaxWidth: 'md',
} as const;

export const videoDetailsHelpConfig: PageHelpProps = {
  title: 'Video Details',
  description:
    'View detailed information about recorded bird visits, including video footage, audio spectrograms, and detection results from both visual and audio analysis.',
  details: [
    {
      title: 'Media Player',
      content:
        'Two viewing modes available:\n- Video tab: Shows recorded video footage of bird visits\n- Audio tab: Displays spectrogram visualization of bird sounds\nTimeline slider allows precise navigation through the recording',
    },
    {
      title: 'Detection Timeline',
      content:
        'Above the player:\n- Current detections shown with bird thumbnail and confidence level\n- Green badge (100%) indicates highest confidence detection\n- Blue badge (95%+) shows high confidence detection\n- Label indicates detection source (video/audio)',
    },
    {
      title: 'Detected Species',
      content:
        'Under "Detected Species" section:\n- Species cards showing detected birds\n- Number in parentheses shows detection count\n- Confidence range for all detections\n- Total duration of species presence\n- "Learn More" links to detailed species information',
    },
    {
      title: 'General Information',
      content:
        'Technical details about the recording:\n- Processor version used for analysis\n- Start and end timestamps\n- Total recording duration\n- Processing details and settings',
    },
    {
      title: 'Weather Context',
      content:
        'Weather conditions during recording:\n- Temperature in Celsius\n- Cloud cover percentage\n- Humidity level\n- Wind speed\n- Weather description (e.g., Mist)\nHelps correlate bird activity with environmental conditions',
    },
    {
      title: 'Audio Analysis',
      content:
        'Spectrogram visualization shows:\n- Bird calls and songs as color patterns\n- Frequency range on vertical axis\n- Time progression on horizontal axis\n- Identified species labeled on the visualization\nHelps verify audio-based species identification',
    },
  ],
  dialogMaxWidth: 'md',
} as const;
