import { View } from "react-native";
import { Spacing } from "@/constants/theme";

type SpacingKey = keyof typeof Spacing;

type Props = {
  size?: SpacingKey;
  width?: number;
  height?: number;
};

export function Spacer(props: Props) {
  let width: number = props.width ?? 1;
  let height: number = props.height ?? 1;

  if (props.size && Spacing[props.size]) {
    const spacing = Spacing[props.size];
    width = spacing;
    height = spacing;
  }

  return (
    <View
      style={{
        width,
        height,
      }}
    />
  );
}

export default Spacer;
