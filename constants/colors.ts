// constants/colors.ts
// Complete colors file with all required properties

const Colors = {
  brand: {
    // Your brand colors
    cherryRed: "#ed4c4c",
    peach: "#faa09a", 
    lightPeach: "#ffd0cd",
    white: "#ffffff",
    
    // Existing colors
    red: "#ed4c4c",
    redDark: "#dc2626",
    green: "#10b981",
    orange: "#f59e0b",
    surface: "#f8f9fa",
    ink: "#1f2937",
    inkMuted: "#6b7280",
    border: "#e5e7eb",
  },
  // Add missing light theme colors for tabs
  light: {
    tint: "#ed4c4c",           // Active tab color (your cherry red)
    tabIconDefault: "#6b7280", // Inactive tab color (muted gray)
    tabIconSelected: "#ed4c4c", // Selected tab color
    text: "#1f2937",           // Text color
    background: "#ffffff",     // Background color
  },
  // Add dark theme colors (optional, but good practice)
  dark: {
    tint: "#faa09a",           // Active tab color (your peach)
    tabIconDefault: "#9ca3af", // Inactive tab color
    tabIconSelected: "#faa09a", // Selected tab color
    text: "#f9fafb",           // Text color
    background: "#111827",     // Background color
  },
};

export default Colors;