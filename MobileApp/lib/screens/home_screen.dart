import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/demo_activities.dart';
import '../state/app_state.dart';
import 'activity_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Pull the latest preferences/limit when the home screen opens.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().refreshSession();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final limit = app.limit;
    final blocked = (limit?.isBlocked ?? false) || (limit?.limitReached ?? false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AbilityHub'),
        actions: [
          IconButton(
            tooltip: 'Osvježi',
            onPressed: () => app.refreshSession(),
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Odjava',
            onPressed: () => app.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => app.refreshSession(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Zdravo, ${app.child?.firstName ?? ''}! 👋',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text('Izaberi zadatak i kreni korak po korak.',
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 16),
            const _AppTimeCard(),
            if (!app.appRegistered) _AppNotRegisteredCard(),
            if (limit != null) _LimitCard(usedMin: limit.usedTodayMinutes, remainingMin: limit.remainingMinutes, blocked: blocked),
            const SizedBox(height: 8),
            ...demoActivities.map((a) => _ActivityCard(
                  activity: a,
                  enabled: !blocked && app.appRegistered,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ActivityScreen(activity: a)),
                  ),
                )),
            if (blocked)
              const Padding(
                padding: EdgeInsets.only(top: 16),
                child: Text('Dostigao si dnevno vrijeme. Vidimo se sutra! 🌙',
                    textAlign: TextAlign.center),
              ),
          ],
        ),
      ),
    );
  }
}

class _LimitCard extends StatelessWidget {
  const _LimitCard({required this.usedMin, required this.remainingMin, required this.blocked});
  final int usedMin;
  final int? remainingMin;
  final bool blocked;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: blocked ? Colors.red.withOpacity(0.1) : null,
      child: ListTile(
        leading: Icon(blocked ? Icons.timer_off : Icons.timer, color: blocked ? Colors.red : null),
        title: Text('Današnje vrijeme: $usedMin min'),
        subtitle: Text(remainingMin != null ? 'Preostalo: $remainingMin min' : 'Bez dnevnog ograničenja'),
      ),
    );
  }
}

/// Live "time in app" — ticks every second from the current foreground session
/// start, so it counts while the child is simply in the app (idle, browsing, or
/// in a task), proving the timer is app-time, not task-time. Also shows today's
/// total (from the backend) and the limit.
class _AppTimeCard extends StatefulWidget {
  const _AppTimeCard();

  @override
  State<_AppTimeCard> createState() => _AppTimeCardState();
}

class _AppTimeCardState extends State<_AppTimeCard> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  String _mmss(Duration d) {
    final m = d.inMinutes.toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final start = app.appSessionStart;
    final elapsed = start == null ? Duration.zero : DateTime.now().difference(start);
    final usedToday = app.limit?.usedTodayMinutes;
    final dailyLimit = app.limit?.dailyLimitMinutes;

    return Card(
      child: ListTile(
        leading: Icon(app.isCountingAppTime ? Icons.timelapse : Icons.timer_off_outlined,
            color: Theme.of(context).colorScheme.primary),
        title: Text('U aplikaciji: ${_mmss(elapsed)}',
            style: const TextStyle(fontWeight: FontWeight.w600, fontFeatures: [FontFeature.tabularFigures()])),
        subtitle: Text(
          usedToday != null
              ? 'Danas ukupno: $usedToday min'
                  '${dailyLimit != null ? ' / $dailyLimit min' : ''}'
              : 'Broji vrijeme provedeno u aplikaciji',
        ),
      ),
    );
  }
}

class _AppNotRegisteredCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.amber.withOpacity(0.15),
      child: const Padding(
        padding: EdgeInsets.all(12),
        child: Text(
          'Ova aplikacija još nije registrovana u katalogu. Admin treba dodati aplikaciju '
          'sa ključem "reference-mobile", a roditelj je dodijeliti djetetu. Statistika se '
          'neće bilježiti dok se to ne uradi.',
        ),
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({required this.activity, required this.enabled, required this.onTap});
  final DemoActivity activity;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: activity.color.withOpacity(0.2),
          child: Text(activity.emoji, style: const TextStyle(fontSize: 22)),
        ),
        title: Text(activity.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${activity.steps.length} koraka • ${activity.activityType}'),
        trailing: const Icon(Icons.chevron_right),
        enabled: enabled,
        onTap: enabled ? onTap : null,
      ),
    );
  }
}
