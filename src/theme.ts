export const colors = {
  ink: "#1B2140",
  inkSoft: "#2A2F52",
  bg: "#EDE6D8",
  bgRadial1: "#F6F1E7",
  bgRadial2: "#E4DBCA",
  surface: "#FFFDF8",
  surfaceTint: "#F6F1E7",
  border: "rgba(27,33,64,0.12)",
  text: "#1B2140",
  muted: "#4A5170",
  muted2: "#5C6178",
  faint: "#9A9EB2",
  saffron: "#D9762B",
  saffronDeep: "#A9722C",
  brass: "#E9B45C",
  teal: "#2E7A73",
  tealDeep: "#1B4B47",
  tealTint: "rgba(46,122,115,0.12)",
  green: "#4C8B5B",
  yellow: "#D9A339",
  yellowDeep: "#8A6414",
  red: "#C25046",
  redDeep: "#A5352C",
};

export const fonts = {
  display: "Marcellus_400Regular",
  wordmark: "RozhaOne_400Regular",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
  bodyLight: "DMSans_300Light",
};

export const crowdColor: Record<"green" | "yellow" | "red", string> = {
  green: colors.green,
  yellow: colors.yellowDeep,
  red: colors.redDeep,
};

export const crowdBg: Record<"green" | "yellow" | "red", string> = {
  green: "rgba(76,139,91,0.14)",
  yellow: "rgba(217,163,57,0.16)",
  red: "rgba(194,80,70,0.12)",
};
