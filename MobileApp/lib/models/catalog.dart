/// One entry from the AppRegistry catalog (`/api/apps`). We only need the id and
/// key here — the app looks itself up by [key] to discover its own catalog id.
class AppCatalogItem {
  final String id;
  final String key;
  final String name;

  AppCatalogItem({required this.id, required this.key, required this.name});

  factory AppCatalogItem.fromJson(Map<String, dynamic> json) => AppCatalogItem(
        id: json['id'] as String? ?? '',
        key: json['key'] as String? ?? '',
        name: json['name'] as String? ?? '',
      );
}
