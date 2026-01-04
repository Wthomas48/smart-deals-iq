import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/lib/theme-context";

export function useTheme() {
  const { colorScheme, isDark, themeMode, setThemeMode } = useThemeContext();
  const theme = Colors[colorScheme];

  return {
    theme,
    isDark,
    themeMode,
    setThemeMode,
    colorScheme,
  };
}
