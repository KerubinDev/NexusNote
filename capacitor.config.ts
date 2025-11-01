import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nexusnote.app",
  appName: "NexusNote",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    Keyboard: {
      resize: "body",
    },
  },
};

export default config;

