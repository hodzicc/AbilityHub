// Outgoing payload for `POST /api/usage/report` (standardized
// `abilityhub.usage.v1`, see BE/docs/usage-format.md). Built here and serialized
// to JSON; the child is taken from the access token, never sent in the body.

/// Accessibility metrics for a single activity. Every field is optional — only
/// the signals this app actually measures are sent, and the platform shows
/// "not available" for the rest.
class ActivityMetricsInput {
  final bool? startedViaAction;
  final bool? completedViaAction;
  final int? stepsCompleted;
  final int? stepsTotal;
  final int? durationSeconds;
  final int? hintsShown;
  final int? errorsCount;

  ActivityMetricsInput({
    this.startedViaAction,
    this.completedViaAction,
    this.stepsCompleted,
    this.stepsTotal,
    this.durationSeconds,
    this.hintsShown,
    this.errorsCount,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (startedViaAction != null) map['startedViaAction'] = startedViaAction;
    if (completedViaAction != null) map['completedViaAction'] = completedViaAction;
    if (stepsCompleted != null) map['stepsCompleted'] = stepsCompleted;
    if (stepsTotal != null) map['stepsTotal'] = stepsTotal;
    if (durationSeconds != null) map['durationSeconds'] = durationSeconds;
    if (hintsShown != null) map['hintsShown'] = hintsShown;
    if (errorsCount != null) map['errorsCount'] = errorsCount;
    return map;
  }
}

class ActivityInput {
  /// Stable id for one attempt; sending the same id as the child advances updates
  /// the same row (live step progress) instead of creating one record per step.
  final String? id;

  /// True for a live progress update (still working), false when finished.
  final bool inProgress;

  final String activityType;
  final String name;
  final double? score;
  final DateTime occurredAt;
  final String? detail;

  /// Generic app-specific key/values (e.g. {'level': '2'}). The platform stores
  /// them opaquely, so any app can send its own keys without a backend change.
  final Map<String, String>? attributes;
  final ActivityMetricsInput? metrics;

  ActivityInput({
    required this.activityType,
    required this.name,
    required this.occurredAt,
    this.id,
    this.inProgress = false,
    this.score,
    this.detail,
    this.attributes,
    this.metrics,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'activityType': activityType,
      'name': name,
      'occurredAt': occurredAt.toUtc().toIso8601String(),
      'inProgress': inProgress,
    };
    if (id != null) map['id'] = id;
    if (score != null) map['score'] = score;
    if (detail != null) map['detail'] = detail;
    if (attributes != null && attributes!.isNotEmpty) map['attributes'] = attributes;
    if (metrics != null) map['metrics'] = metrics!.toJson();
    return map;
  }
}

class UsageSessionInput {
  /// Stable id for one continuous foreground period; sending it repeatedly lets
  /// the server update the same session row (a heartbeat) instead of inserting many.
  final String? id;
  final DateTime startedAt;
  final DateTime endedAt;

  UsageSessionInput({required this.startedAt, required this.endedAt, this.id});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'startedAt': startedAt.toUtc().toIso8601String(),
      'endedAt': endedAt.toUtc().toIso8601String(),
    };
    if (id != null) map['id'] = id;
    return map;
  }
}

class UsageReport {
  final String applicationId;
  final UsageSessionInput? session;
  final List<ActivityInput> activities;

  UsageReport({
    required this.applicationId,
    this.session,
    this.activities = const [],
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'applicationId': applicationId,
      'activities': activities.map((a) => a.toJson()).toList(),
    };
    if (session != null) map['session'] = session!.toJson();
    return map;
  }
}
