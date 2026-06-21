import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config.dart';
import 'token_store.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);
  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Thin wrapper over `http` that targets the AbilityHub gateway, attaches the
/// bearer token, and transparently refreshes it once on a 401 — mirroring the
/// web app's `apiFetch`. All service classes go through this.
class ApiClient {
  ApiClient(this._tokens);

  final TokenStore _tokens;
  final http.Client _http = http.Client();
  String get baseUrl => AppConfig.apiBaseUrl;

  /// POST to a public endpoint (login / pairing exchange / refresh) without
  /// attaching a bearer token or running the 401-refresh logic. Returns the
  /// decoded JSON map, or an empty map when the server sends no body (e.g. a 401
  /// on bad credentials).
  Future<Map<String, dynamic>> postAnonymousJson(String path, Object body) async {
    final res = await _http.post(
      Uri.parse('$baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (res.body.isEmpty) return <String, dynamic>{};
    final data = jsonDecode(res.body);
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  Future<dynamic> get(String path) => _send('GET', path);

  Future<dynamic> post(String path, {Object? body}) => _send('POST', path, body: body);

  Future<dynamic> put(String path, {Object? body}) => _send('PUT', path, body: body);

  Future<dynamic> _send(String method, String path, {Object? body}) async {
    var response = await _raw(method, path, body: body);

    // Access token expired → try a single refresh + replay.
    if (response.statusCode == 401 && await _tryRefresh()) {
      response = await _raw(method, path, body: body);
    }

    if (response.statusCode == 401) {
      await _tokens.clear();
      throw ApiException(401, 'Sesija je istekla. Prijavi se ponovo.');
    }
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode,
          response.body.isEmpty ? 'Greška ${response.statusCode}' : response.body);
    }

    if (response.body.isEmpty) return null;
    return jsonDecode(response.body);
  }

  Future<http.Response> _raw(String method, String path, {Object? body}) {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};
    final token = _tokens.accessToken;
    if (token != null && token.isNotEmpty) headers['Authorization'] = 'Bearer $token';

    final encoded = body == null ? null : jsonEncode(body);
    switch (method) {
      case 'POST':
        return _http.post(uri, headers: headers, body: encoded);
      case 'PUT':
        return _http.put(uri, headers: headers, body: encoded);
      case 'GET':
      default:
        return _http.get(uri, headers: headers);
    }
  }

  Future<bool> _tryRefresh() async {
    final rt = _tokens.refreshToken;
    if (rt == null || rt.isEmpty) return false;
    try {
      final res = await _http.post(
        Uri.parse('$baseUrl/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': rt}),
      );
      if (res.statusCode >= 400) return false;
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        await _tokens.save(data['accessToken'] as String, data['refreshToken'] as String);
        return true;
      }
    } catch (_) {}
    return false;
  }
}
