import { TextInput as RNTextInput, type TextInputProps } from "react-native";
import { colors } from "../theme";

// None of the screens across the app ever set placeholderTextColor
// explicitly, relying on Android's default EditText hint color - which on
// at least one real device/OS theme renders close enough to the input
// background to be effectively invisible. A `TextInput.defaultProps`
// assignment in App.tsx did not fix this (defaultProps is not honored on
// RN's function-component TextInput in this version), so this thin wrapper
// applies the color directly as an actual prop instead. Swap the "react-native"
// TextInput import for this one wherever a placeholder needs to stay visible.
export function TextInput(props: TextInputProps) {
  return <RNTextInput placeholderTextColor={colors.muted2} {...props} />;
}
