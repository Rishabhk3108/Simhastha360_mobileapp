import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Thin wrappers over @expo/vector-icons (bundled with Expo, near-zero extra
// download) preserving the phosphor-react-native call signature we designed
// screens around. phosphor-react-native's barrel import pulled its entire
// ~1500-icon set into the JS bundle (14MB+), which made first-load on a
// physical device via Expo Go take many minutes over Wi-Fi.
interface IconProps {
  size: number;
  color: string;
  weight?: string;
}

export const MapTrifold = ({ size, color }: IconProps) => <Ionicons name="map" size={size} color={color} />;
export const Lifebuoy = ({ size, color }: IconProps) => <MaterialCommunityIcons name="lifebuoy" size={size} color={color} />;
export const Sparkle = ({ size, color }: IconProps) => <Ionicons name="sparkles" size={size} color={color} />;
export const ClipboardText = ({ size, color }: IconProps) => <Ionicons name="clipboard" size={size} color={color} />;
export const UserCircle = ({ size, color }: IconProps) => <Ionicons name="person-circle-outline" size={size} color={color} />;
export const MagnifyingGlass = ({ size, color }: IconProps) => <Ionicons name="search" size={size} color={color} />;
export const CloudSlash = ({ size, color }: IconProps) => <Ionicons name="cloud-offline-outline" size={size} color={color} />;
export const Crosshair = ({ size, color }: IconProps) => <Ionicons name="locate" size={size} color={color} />;
export const FirstAidKit = ({ size, color }: IconProps) => <MaterialCommunityIcons name="medical-bag" size={size} color={color} />;
export const Drop = ({ size, color }: IconProps) => <Ionicons name="water" size={size} color={color} />;
export const DropHalf = ({ size, color }: IconProps) => <Ionicons name="water" size={size} color={color} />;
export const Info = ({ size, color }: IconProps) => <Ionicons name="information-circle" size={size} color={color} />;
export const Toilet = ({ size, color }: IconProps) => <MaterialCommunityIcons name="toilet" size={size} color={color} />;
export const NavigationArrow = ({ size, color }: IconProps) => <Ionicons name="navigate" size={size} color={color} />;
export const Siren = ({ size, color }: IconProps) => <MaterialCommunityIcons name="alarm-light" size={size} color={color} />;
export const UsersThree = ({ size, color }: IconProps) => <Ionicons name="people" size={size} color={color} />;
export const UserFocus = ({ size, color }: IconProps) => <MaterialCommunityIcons name="account-search" size={size} color={color} />;
export const Microphone = ({ size, color }: IconProps) => <Ionicons name="mic" size={size} color={color} />;
export const QrCode = ({ size, color }: IconProps) => <Ionicons name="qr-code" size={size} color={color} />;
export const WarningCircle = ({ size, color }: IconProps) => <Ionicons name="alert-circle" size={size} color={color} />;
export const MapPin = ({ size, color }: IconProps) => <Ionicons name="location-outline" size={size} color={color} />;
export const Clock = ({ size, color }: IconProps) => <Ionicons name="time-outline" size={size} color={color} />;
export const X = ({ size, color }: IconProps) => <Ionicons name="close" size={size} color={color} />;
export const Car = ({ size, color }: IconProps) => <Ionicons name="car-sport" size={size} color={color} />;
export const Bell = ({ size, color }: IconProps) => <Ionicons name="notifications" size={size} color={color} />;
export const Star = ({ size, color }: IconProps) => <Ionicons name="star" size={size} color={color} />;
export const Camera = ({ size, color }: IconProps) => <Ionicons name="camera" size={size} color={color} />;
export const CheckCircle = ({ size, color }: IconProps) => <Ionicons name="checkmark-circle" size={size} color={color} />;
export const Coins = ({ size, color }: IconProps) => <MaterialCommunityIcons name="hand-coin" size={size} color={color} />;
export const LogOut = ({ size, color }: IconProps) => <Ionicons name="log-out-outline" size={size} color={color} />;
export const ChartBar = ({ size, color }: IconProps) => <Ionicons name="stats-chart" size={size} color={color} />;
