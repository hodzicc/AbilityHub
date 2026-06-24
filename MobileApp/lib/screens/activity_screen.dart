import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../data/demo_activities.dart';
import '../models/usage_report.dart';
import '../state/app_state.dart';
import '../util/uuid.dart';

enum _Phase { intro, running, summary }

/// Runs one task step-by-step and captures the accessibility metrics the platform
/// asked for: started/finished via an explicit action, steps completed/total,
/// duration, hints shown, and errors (going back a step). On finish it reports
/// usage so the parent's web statistics reflect real, step-level progress.
class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key, required this.activity});
  final DemoActivity activity;

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  _Phase _phase = _Phase.intro;
  late DateTime _startedAt;
  late DateTime _endedAt;
  late String _activityId;
  int _currentStep = 0;
  int _hintsShown = 0;
  int _errorsCount = 0;
  bool _showHint = false;
  bool _submitting = false;

  List<DemoStep> get _steps => widget.activity.steps;

  // Audible/haptic confirmation, gated on the child's "sound enabled" preference.
  // Demonstrates that the soundEnabled toggle actually changes app behavior.
  void _feedback() {
    final prefs = context.read<AppState>().prefs;
    if (!prefs.soundEnabled) return;
    SystemSound.play(SystemSoundType.click);
    HapticFeedback.lightImpact();
  }

  void _start() {
    setState(() {
      _phase = _Phase.running;
      _startedAt = DateTime.now();
      _currentStep = 0;
      _hintsShown = 0;
      _errorsCount = 0;
      _showHint = false;
    });
    _activityId = uuidV4();
    _sendProgress(0); // "started", on step 1 (0 completed)
  }

  // Live progress update — the same activity row is updated as the child advances,
  // so the parent's dashboard shows which step the child is currently on.
  void _sendProgress(int stepsCompleted) {
    context
        .read<AppState>()
        .reportActivity(
          activityId: _activityId,
          inProgress: true,
          activityType: widget.activity.activityType,
          name: widget.activity.title,
          occurredAt: DateTime.now(),
          metrics: ActivityMetricsInput(
            startedViaAction: true,
            completedViaAction: false,
            stepsCompleted: stepsCompleted,
            stepsTotal: _steps.length,
            durationSeconds: DateTime.now().difference(_startedAt).inSeconds,
            hintsShown: _hintsShown,
            errorsCount: _errorsCount,
          ),
          detail: 'Korak ${stepsCompleted + 1}/${_steps.length}',
          attributes: {'level': '${widget.activity.level}'},
        )
        .catchError((_) {}); // progress is best-effort, fire-and-forget
  }

  void _showHintTapped() {
    setState(() {
      _hintsShown++;
      _showHint = true;
    });
  }

  void _completeStep() {
    _feedback();
    final completedNow = _currentStep + 1; // they just finished the current step
    _sendProgress(completedNow);
    if (_currentStep >= _steps.length - 1) {
      setState(() {
        _endedAt = DateTime.now();
        _phase = _Phase.summary;
      });
    } else {
      setState(() {
        _currentStep++;
        _showHint = false;
      });
    }
  }

  // Returning to a previous step counts as an error per the metrics spec.
  void _goBack() {
    if (_currentStep == 0) return;
    setState(() {
      _currentStep--;
      _errorsCount++;
      _showHint = false;
    });
  }

  int get _durationSeconds => _endedAt.difference(_startedAt).inSeconds;

  Future<void> _submit() async {
    setState(() => _submitting = true);
    final app = context.read<AppState>();
    final metrics = ActivityMetricsInput(
      startedViaAction: true,
      completedViaAction: true,
      stepsCompleted: _steps.length,
      stepsTotal: _steps.length,
      durationSeconds: _durationSeconds,
      hintsShown: _hintsShown,
      errorsCount: _errorsCount,
    );
    try {
      await app.reportActivity(
        activityId: _activityId,
        inProgress: false,
        activityType: widget.activity.activityType,
        name: widget.activity.title,
        occurredAt: _endedAt,
        metrics: metrics,
        detail: 'Završeno ${_steps.length} koraka, $_hintsShown pomoći, $_errorsCount grešaka',
        attributes: {'level': '${widget.activity.level}'},
      );
      if (!mounted) return;
      _feedback();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bravo! Zadatak je poslan. 🎉')),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Slanje nije uspjelo: $e')),
      );
    }
  }

  // Leaving mid-task still reports the activity with its real completion
  // percentage (stepsCompleted/stepsTotal) and completedViaAction = false.
  Future<void> _reportPartial() async {
    final app = context.read<AppState>();
    final endedAt = DateTime.now();
    try {
      await app.reportActivity(
        activityId: _activityId,
        inProgress: false,
        activityType: widget.activity.activityType,
        name: widget.activity.title,
        occurredAt: endedAt,
        metrics: ActivityMetricsInput(
          startedViaAction: true,
          completedViaAction: false,
          stepsCompleted: _currentStep,
          stepsTotal: _steps.length,
          durationSeconds: endedAt.difference(_startedAt).inSeconds,
          hintsShown: _hintsShown,
          errorsCount: _errorsCount,
        ),
        detail: 'Prekinuto na koraku $_currentStep/${_steps.length}',
        attributes: {'level': '${widget.activity.level}'},
      );
    } catch (_) {
      // Don't block navigation if the report fails.
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      // Free to leave on the intro/summary screens; mid-task we intercept to
      // record partial progress first.
      canPop: _phase != _Phase.running && !_submitting,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop || _phase != _Phase.running) return;
        final navigator = Navigator.of(context);
        await _reportPartial();
        if (mounted) navigator.pop();
      },
      child: Scaffold(
        appBar: AppBar(title: Text(widget.activity.title)),
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: switch (_phase) {
            _Phase.intro => _buildIntro(),
            _Phase.running => _buildRunning(),
            _Phase.summary => _buildSummary(),
          },
        ),
      ),
    );
  }

  Widget _buildIntro() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(widget.activity.emoji, style: const TextStyle(fontSize: 72)),
        const SizedBox(height: 16),
        Text(widget.activity.title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text('${_steps.length} koraka', style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _start,
            icon: const Icon(Icons.play_arrow),
            label: const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Text('Počni', style: TextStyle(fontSize: 20)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRunning() {
    final step = _steps[_currentStep];
    final progress = (_currentStep + 1) / _steps.length;
    // The reducedMotion preference removes the step transition animation: when on,
    // the next step appears instantly instead of fading/sliding in.
    final reducedMotion = context.watch<AppState>().prefs.reducedMotion;
    final stepContent = Center(
      key: ValueKey(_currentStep),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(step.instruction,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall),
          if (_showHint) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lightbulb),
                  const SizedBox(width: 12),
                  Expanded(child: Text(step.hint)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LinearProgressIndicator(value: progress),
        const SizedBox(height: 8),
        Text('Korak ${_currentStep + 1} od ${_steps.length}',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 24),
        Expanded(
          child: AnimatedSwitcher(
            duration: reducedMotion ? Duration.zero : const Duration(milliseconds: 300),
            child: stepContent,
          ),
        ),
        Row(
          children: [
            if (_currentStep > 0)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _goBack,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Vrati se'),
                ),
              ),
            if (_currentStep > 0) const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _showHintTapped,
                icon: const Icon(Icons.help_outline),
                label: const Text('Pomoć'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _completeStep,
            icon: Icon(_currentStep >= _steps.length - 1 ? Icons.check : Icons.arrow_forward),
            label: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(_currentStep >= _steps.length - 1 ? 'Završi korak' : 'Sljedeći korak',
                  style: const TextStyle(fontSize: 18)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummary() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.emoji_events, size: 72, color: Colors.amber),
        const SizedBox(height: 12),
        Text('Sjajno! Završio si zadatak.',
            textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 24),
        _summaryRow('Koraci', '${_steps.length}/${_steps.length}'),
        _summaryRow('Vrijeme', '$_durationSeconds s'),
        _summaryRow('Pomoći', '$_hintsShown'),
        _summaryRow('Greške (vraćanja)', '$_errorsCount'),
        const SizedBox(height: 32),
        FilledButton.icon(
          onPressed: _submitting ? null : _submit,
          icon: _submitting
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.send),
          label: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('Pošalji i završi', style: TextStyle(fontSize: 18)),
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyLarge),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        ],
      ),
    );
  }
}
