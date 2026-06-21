import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';

/// Full-screen lock shown the moment the child's daily limit is reached or the
/// app is blocked by the parent. It covers everything (even a running activity)
/// and can't be dismissed. When the parent lifts the limit, the SignalR push
/// updates the state and this screen disappears automatically — instantly.
class LockoutScreen extends StatelessWidget {
  const LockoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final limit = app.limit;
    final blockedByParent = limit?.isBlocked ?? false;

    return Material(
      color: const Color(0xFF1E1B4B),
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🌙', style: TextStyle(fontSize: 72)),
                const SizedBox(height: 16),
                Text(
                  blockedByParent ? 'Pauza' : 'Vrijeme je isteklo',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text(
                  blockedByParent
                      ? 'Roditelj je privremeno pauzirao aplikaciju.\nVidimo se uskoro!'
                      : 'Iskoristio si vrijeme za danas.\nVidimo se sutra!',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, fontSize: 18),
                ),
                if (limit != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Danas: ${limit.usedTodayMinutes} min'
                    '${limit.dailyLimitMinutes != null ? ' / ${limit.dailyLimitMinutes} min' : ''}',
                    style: const TextStyle(color: Colors.white54, fontSize: 14),
                  ),
                ],
                const SizedBox(height: 32),
                OutlinedButton.icon(
                  onPressed: () => app.logout(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  icon: const Icon(Icons.logout),
                  label: const Text('Odjava'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
