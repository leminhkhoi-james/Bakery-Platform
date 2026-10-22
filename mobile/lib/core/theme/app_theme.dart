import 'package:flutter/material.dart';

abstract final class Brand {
  static const wine = Color(0xFF6B212E);
  static const wineDark = Color(0xFF4F1722);
  static const caramel = Color(0xFFB87328);
  static const paper = Color(0xFFFFFDFA);
  static const cream = Color(0xFFF7F0E6);
  static const blush = Color(0xFFF5DCD7);
  static const ink = Color(0xFF241815);
  static const muted = Color(0xFF695E57);
  static const border = Color(0xFFEBDCD0);
  static const error = Color(0xFFB91C1C);
  static const success = Color(0xFF356547);
  static const radius = 20.0;
  static const pagePadding = 20.0;
  static ThemeData get theme {
    final scheme = ColorScheme.fromSeed(seedColor: wine).copyWith(
      primary: wine,
      onPrimary: Colors.white,
      secondary: caramel,
      surface: paper,
      onSurface: ink,
      outline: border,
      error: error,
      primaryContainer: blush,
      secondaryContainer: cream,
    );
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: 'PlusJakartaSans',
      scaffoldBackgroundColor: paper,
    );
    return base.copyWith(
      textTheme: base.textTheme.copyWith(
        headlineLarge: const TextStyle(
          fontFamily: 'Quicksand',
          fontSize: 30,
          fontWeight: FontWeight.w700,
          color: wine,
          height: 1.2,
        ),
        headlineMedium: const TextStyle(
          fontFamily: 'Quicksand',
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: wine,
        ),
        titleLarge: const TextStyle(
          fontFamily: 'Quicksand',
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: wine,
        ),
        titleMedium: const TextStyle(
          fontFamily: 'Quicksand',
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        bodyMedium: const TextStyle(
          fontFamily: 'PlusJakartaSans',
          fontSize: 14,
          height: 1.6,
          color: ink,
        ),
        bodySmall: const TextStyle(
          fontFamily: 'PlusJakartaSans',
          fontSize: 12,
          height: 1.5,
          color: muted,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: paper,
        foregroundColor: wine,
        centerTitle: false,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Brand.radius),
          side: const BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cream.withValues(alpha: .6),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: wine, width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 50),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: 'PlusJakartaSans',
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: border),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        selectedColor: blush,
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 6),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: blush,
      ),
      dividerTheme: const DividerThemeData(color: border, space: 24),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: wineDark,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
