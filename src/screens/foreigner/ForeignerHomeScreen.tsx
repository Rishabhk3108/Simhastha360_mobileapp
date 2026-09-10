import { View } from "react-native";
import { HomeScreen } from "../HomeScreen";
import { KnowMoreButton } from "../../components/foreigner/KnowMoreButton";
import { RecommendedPlaceToast } from "../../components/foreigner/RecommendedPlaceToast";
import { CulturalFactPopup } from "../../components/foreigner/CulturalFactPopup";

export function ForeignerHomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HomeScreen />
      <KnowMoreButton />
      <CulturalFactPopup />
      <RecommendedPlaceToast />
    </View>
  );
}
