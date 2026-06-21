/// Mirrors the Usage service `LimitStatusResponse` — today's usage vs the
/// configured daily limit. Apps call this to self-enforce limits (advisory).
class LimitStatus {
  final bool isBlocked;
  final int? dailyLimitMinutes;
  final int usedTodayMinutes;
  final int? remainingMinutes;
  final bool limitReached;

  LimitStatus({
    required this.isBlocked,
    required this.dailyLimitMinutes,
    required this.usedTodayMinutes,
    required this.remainingMinutes,
    required this.limitReached,
  });

  factory LimitStatus.fromJson(Map<String, dynamic> json) => LimitStatus(
        isBlocked: json['isBlocked'] as bool? ?? false,
        dailyLimitMinutes: json['dailyLimitMinutes'] as int?,
        usedTodayMinutes: json['usedTodayMinutes'] as int? ?? 0,
        remainingMinutes: json['remainingMinutes'] as int?,
        limitReached: json['limitReached'] as bool? ?? false,
      );
}
