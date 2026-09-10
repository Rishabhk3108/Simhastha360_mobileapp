import { useTranslation } from "react-i18next";
import { Screen } from "../components/Screen";
import { PilgrimProfileCard } from "../components/PilgrimProfileCard";

export function AccountScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t("account.title")}>
      <PilgrimProfileCard />
    </Screen>
  );
}
