import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Next's dev server only fully hydrates (attaches interactivity) for
   * requests whose Origin is localhost or the origin it was started with —
   * everything else gets served HTML/CSS fine but silently loses JS
   * interactivity (swipe worked because it's plain CSS scroll; tap-to-select
   * didn't, because that needs React's event listeners, which never attach).
   * This is exactly what breaks testing on a phone over the home WiFi via
   * the printed "Network:" URL. Allow common private-LAN address patterns —
   * safe here since this only ever applies to `next dev`, never a real
   * deployment, and only to devices already on the same local network.
   */
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*", "172.17.*.*", "172.18.*.*", "172.19.*.*",
    "172.2*.*.*", "172.30.*.*", "172.31.*.*",
  ],
};

export default nextConfig;
