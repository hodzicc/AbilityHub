/// Mirrors the Auth service `AuthResponse` (login / refresh / pairing exchange).
class AuthResponse {
  final bool success;
  final String accessToken;
  final String refreshToken;
  final String message;

  AuthResponse({
    required this.success,
    required this.accessToken,
    required this.refreshToken,
    required this.message,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        success: json['success'] as bool? ?? false,
        accessToken: json['accessToken'] as String? ?? '',
        refreshToken: json['refreshToken'] as String? ?? '',
        message: json['message'] as String? ?? '',
      );
}
