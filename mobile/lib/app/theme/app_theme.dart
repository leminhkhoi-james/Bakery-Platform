import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppSpacing {
  static const double xs = 4, sm = 8, md = 16, lg = 24, xl = 40, xxl = 48;
  static const double controlRadius = 12, cardRadius = 20, badgeRadius = 8;
  static const double touchTarget = 48;
}

abstract final class AppTypography {
  static TextStyle style(double size, {int weight = 400, Color? color}) =>
      TextStyle(
        fontFamily: 'PlusJakartaSans',
        fontSize: size,
        height: size >= 20 ? 1.3 : 1.6,
        fontWeight: FontWeight.values[(weight ~/ 100 - 1).clamp(0, 8)],
        fontVariations: [FontVariation('wght', weight.toDouble())],
        color: color ?? AppColors.text,
      );

  static TextTheme get textTheme => TextTheme(
    displaySmall: style(32, weight: 700, color: AppColors.wine),
    headlineLarge: style(32, weight: 700, color: AppColors.wine),
    headlineMedium: style(28, weight: 700, color: AppColors.wine),
    headlineSmall: style(24, weight: 700, color: AppColors.wine),
    titleLarge: style(20, weight: 700, color: AppColors.wine),
    titleMedium: style(16, weight: 700),
    titleSmall: style(14, weight: 600),
    bodyLarge: style(16),
    bodyMedium: style(14),
    bodySmall: style(12, color: AppColors.muted),
    labelLarge: style(14, weight: 600),
    labelMedium: style(12, weight: 600),
    labelSmall: style(12, weight: 500),
  );
}

abstract final class SweetCakeTheme {
  static ThemeData get light {
    const scheme = ColorScheme.light(
      primary: AppColors.wine,
      onPrimary: AppColors.white,
      primaryContainer: AppColors.softPink,
      onPrimaryContainer: AppColors.wineDark,
      secondary: AppColors.accent,
      onSecondary: AppColors.white,
      secondaryContainer: AppColors.softPink,
      onSecondaryContainer: AppColors.wine,
      surface: AppColors.white,
      onSurface: AppColors.text,
      onSurfaceVariant: AppColors.muted,
      surfaceContainerLow: AppColors.background,
      surfaceContainer: AppColors.surfaceLow,
      outline: AppColors.muted,
      outlineVariant: AppColors.border,
      error: AppColors.error,
      onError: AppColors.white,
    );
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: AppTypography.textTheme,
      fontFamily: 'PlusJakartaSans',
      scaffoldBackgroundColor: AppColors.background,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.wine,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: AppTypography.style(
          20,
          weight: 700,
          color: AppColors.wine,
        ),
        centerTitle: false,
        elevation: 0,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: shape,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          textStyle: AppTypography.style(14, weight: 600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: shape,
          side: const BorderSide(color: AppColors.wine),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: AppTypography.style(14, weight: 600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: const Size(48, 48),
          textStyle: AppTypography.style(14, weight: 600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.accent, width: 2),
        ),
        labelStyle: AppTypography.style(14, color: AppColors.muted),
        errorMaxLines: 3,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.white,
        indicatorColor: AppColors.softPink,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => AppTypography.style(
            12,
            weight: states.contains(WidgetState.selected) ? 700 : 500,
            color: states.contains(WidgetState.selected)
                ? AppColors.wine
                : AppColors.muted,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.white,
        selectedColor: AppColors.softPink,
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        labelStyle: AppTypography.style(12, weight: 600),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.wineDark,
        contentTextStyle: AppTypography.style(14, color: AppColors.white),
        behavior: SnackBarBehavior.floating,
        shape: shape,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.white,
        showDragHandle: true,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 24,
      ),
    );
  }
}
