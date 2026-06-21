/// Mirrors the Users service `UserProfileResponse`.
class UserProfile {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final int roleId;
  final bool isActive;

  UserProfile({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.roleId,
    required this.isActive,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] as String? ?? '',
        email: json['email'] as String? ?? '',
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        roleId: json['roleId'] as int? ?? 0,
        isActive: json['isActive'] as bool? ?? true,
      );
}
