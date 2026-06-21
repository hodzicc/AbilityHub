import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import 'state/app_state.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/lockout_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load configuration from the .env file (URLs, app key). Tolerate a missing
  // file so the app still starts on built-in defaults.
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {}
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState()..bootstrap(),
      child: const AbilityHubApp(),
    ),
  );
}

class AbilityHubApp extends StatelessWidget {
  const AbilityHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return MaterialApp(
      title: 'AbilityHub',
      debugShowCheckedModeBanner: false,
      theme: app.theme,
      // Apply the child's font-size preference, and overlay the lockout screen on
      // top of everything (even a running activity) the instant the limit hits.
      builder: (context, child) {
        final scaled = MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(textScaler: TextScaler.linear(app.prefs.textScale)),
          child: child ?? const SizedBox.shrink(),
        );
        if (app.status == SessionStatus.authenticated && app.lockedOut) {
          return Stack(children: [scaled, const LockoutScreen()]);
        }
        return scaled;
      },
      home: switch (app.status) {
        SessionStatus.loading => const _SplashScreen(),
        SessionStatus.unauthenticated => const LoginScreen(),
        SessionStatus.authenticated => const HomeScreen(),
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
