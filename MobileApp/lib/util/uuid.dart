import 'dart:math';

/// Minimal RFC-4122 v4 UUID (no extra dependency). Used to give each foreground
/// session a stable id the backend can upsert against.
String uuidV4() {
  final r = Random();
  final b = List<int>.generate(16, (_) => r.nextInt(256));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  String hex(int x) => x.toRadixString(16).padLeft(2, '0');
  final h = b.map(hex).join();
  return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-'
      '${h.substring(16, 20)}-${h.substring(20)}';
}
