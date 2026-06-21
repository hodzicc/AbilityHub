import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../state/app_state.dart';

enum LoginMode { qr, password }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  LoginMode _mode = LoginMode.qr;
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  final MobileScannerController _scanner = MobileScannerController();
  bool _busy = false;
  bool _handlingScan = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _tokenCtrl.dispose();
    _scanner.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
      // On success the provider flips to "authenticated" and the app swaps
      // screens; nothing more to do here.
    } catch (e) {
      if (mounted) setState(() => _error = _friendly(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _friendly(Object e) {
    final s = e.toString().replaceFirst('Exception: ', '');
    return s.contains('SocketException') || s.contains('Failed host')
        ? 'Ne mogu se povezati na server (${AppConfig.apiBaseUrl}). Provjeri da li backend radi.'
        : s;
  }

  void _onScan(BarcodeCapture capture) {
    if (_handlingScan || _busy) return;
    final raw = capture.barcodes.isNotEmpty ? capture.barcodes.first.rawValue : null;
    if (raw == null || raw.isEmpty) return;

    final token = _extractToken(raw);
    if (token == null) {
      setState(() => _error = 'Ovo nije AbilityHub QR kod.');
      return;
    }
    _handlingScan = true;
    _run(() => context.read<AppState>().loginWithPairingToken(token))
        .whenComplete(() => _handlingScan = false);
  }

  /// The web QR encodes {type:'abilityhub-pairing', childId, token}. Accept that,
  /// or a bare token string, for flexibility.
  String? _extractToken(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map && decoded['token'] is String) return decoded['token'] as String;
    } catch (_) {
      // Not JSON — treat the whole string as the token.
      if (raw.trim().isNotEmpty) return raw.trim();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('AbilityHub', style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Prijava za korisnika', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 24),
                  SegmentedButton<LoginMode>(
                    segments: const [
                      ButtonSegment(value: LoginMode.qr, icon: Icon(Icons.qr_code_scanner), label: Text('QR kod')),
                      ButtonSegment(value: LoginMode.password, icon: Icon(Icons.password), label: Text('Lozinka')),
                    ],
                    selected: {_mode},
                    onSelectionChanged: (s) => setState(() {
                      _mode = s.first;
                      _error = null;
                    }),
                  ),
                  const SizedBox(height: 20),
                  if (_mode == LoginMode.qr) _buildQr() else _buildPassword(),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                  ],
                  if (_busy) ...[
                    const SizedBox(height: 16),
                    const CircularProgressIndicator(),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQr() {
    return Column(
      children: [
        Text(
          'Skeniraj QR kod sa profila djeteta na web stranici.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 260,
            width: 260,
            child: MobileScanner(controller: _scanner, onDetect: _onScan),
          ),
        ),
        const SizedBox(height: 16),
        const Divider(),
        const SizedBox(height: 8),
        Text('Nemaš kameru? Zalijepi token ručno:',
            style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 8),
        TextField(
          controller: _tokenCtrl,
          decoration: const InputDecoration(labelText: 'Pairing token', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: _busy
              ? null
              : () => _run(() => context.read<AppState>().loginWithPairingToken(_tokenCtrl.text.trim())),
          child: const Text('Prijavi se tokenom'),
        ),
      ],
    );
  }

  Widget _buildPassword() {
    return Column(
      children: [
        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordCtrl,
          obscureText: true,
          decoration: const InputDecoration(labelText: 'Lozinka', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _busy
                ? null
                : () => _run(() => context
                    .read<AppState>()
                    .loginWithCredentials(_emailCtrl.text.trim(), _passwordCtrl.text)),
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Prijavi se'),
            ),
          ),
        ),
      ],
    );
  }
}
