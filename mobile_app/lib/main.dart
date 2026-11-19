import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

const String kInggriskuFullUrl = 'https://gemini.google.com/share/ac8c037c304e';
const String kInggriskuShortUrl = 'https://share.gemini.google/ZY0RuOq26UPE';
const String kChromeMobileUA =
    'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const MethodChannel _permChannel =
    MethodChannel('com.brainforge.brainforge_app/permissions');

enum _ActivePage { dashboard, brainforge, inggrisku }

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BrainForgeApp());
}

class BrainForgeApp extends StatelessWidget {
  const BrainForgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BrainForge.AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1565C0)),
        scaffoldBackgroundColor: const Color(0xFFF5F7FA),
        useMaterial3: true,
      ),
      home: const BrainForgeHubPage(),
    );
  }
}

class BrainForgeHubPage extends StatefulWidget {
  const BrainForgeHubPage({super.key});

  @override
  State<BrainForgeHubPage> createState() => _BrainForgeHubPageState();
}

class _BrainForgeHubPageState extends State<BrainForgeHubPage> {
  late final WebViewController _brainForgeController;
  late final WebViewController _inggriskuController;

  _ActivePage _activePage = _ActivePage.dashboard;
  bool _inggriskuLoadedOnce = false;
  int _inggriskuProgress = 0;
  double _brainForgeScrollY = 0;
  bool _inggriskuShowHeader = true;
  double _inggriskuDragDy = 0;
  DateTime? _lastInggriskuBackSwipe;

  // Pengaturan terpisah khusus Inggrisku.AI
  bool _hideGeminiWrapper = true;
  bool _useShortUrl = false;

  String get _currentInggriskuUrl =>
      _useShortUrl ? kInggriskuShortUrl : kInggriskuFullUrl;

  Future<bool> _ensureAndroidMicPermission({bool showPromptIfDenied = true}) async {
    try {
      final has = await _permChannel.invokeMethod<bool>('hasMicPermission') ?? false;
      if (has) return true;
      final granted =
          await _permChannel.invokeMethod<bool>('requestMicPermission') ?? false;
      if (!granted && showPromptIfDenied && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Izin mikrofon dibutuhkan. Aktifkan di Pengaturan HP jika dialog tidak muncul.',
            ),
            action: SnackBarAction(
              label: 'Buka Pengaturan',
              onPressed: () => _permChannel.invokeMethod('openAppSettings'),
            ),
            duration: const Duration(seconds: 5),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return granted;
    } catch (_) {
      return false;
    }
  }

  @override
  void initState() {
    super.initState();

    _brainForgeController = WebViewController(
      onPermissionRequest: (WebViewPermissionRequest request) async {
        await _ensureAndroidMicPermission();
        await request.grant();
      },
    )
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF8FAFC))
      ..addJavaScriptChannel(
        'BrainForgeBridge',
        onMessageReceived: (JavaScriptMessage message) async {
          try {
            final data = jsonDecode(message.message) as Map<String, dynamic>;
            final text = data['text'] as String?;
            if (text != null && text.isNotEmpty) {
              await Clipboard.setData(ClipboardData(text: text));
            }
            if (data['action'] == 'switch_tab' && data['tab'] == 'inggrisku') {
              _openInggrisku();
              return;
            }
            if (data['action'] == 'open_url') {
              final urlStr = data['url'] as String?;
              if (urlStr != null && urlStr.isNotEmpty) {
                if (urlStr.contains('gemini.google.com/share/') ||
                    urlStr.contains('share.gemini.google/')) {
                  _openInggrisku();
                  return;
                }
                await launchUrl(Uri.parse(urlStr), mode: LaunchMode.externalApplication);
              }
            }
          } catch (_) {}
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            _brainForgeController.runJavaScript(
              "document.body && document.body.classList.add('in-flutter-app');",
            );
          },
          onNavigationRequest: (NavigationRequest request) async {
            final url = request.url;
            if (url.contains('gemini.google.com/share/') ||
                url.contains('share.gemini.google/')) {
              _openInggrisku();
              return NavigationDecision.prevent;
            }
            if (url.startsWith('https://gemini.google.com') ||
                url.startsWith('https://chatgpt.com')) {
              await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..setOnScrollPositionChange((ScrollPositionChange change) {
        if (!mounted) return;
        final nextY = change.y < 0 ? 0.0 : change.y;
        if ((nextY - _brainForgeScrollY).abs() >= 1.0 &&
            (nextY <= 72.0 || _brainForgeScrollY <= 72.0)) {
          setState(() => _brainForgeScrollY = nextY);
        }
      })
      ..loadFlutterAsset('assets/brainforge.html');

    _inggriskuController = WebViewController(
      onPermissionRequest: (WebViewPermissionRequest request) async {
        await _ensureAndroidMicPermission();
        await request.grant();
      },
    )
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(kChromeMobileUA)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() => _inggriskuProgress = progress);
            }
            if (progress >= 65 && _hideGeminiWrapper) {
              _injectFullscreenCanvasScript();
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() => _inggriskuProgress = 100);
            }
            if (_hideGeminiWrapper) {
              _injectFullscreenCanvasScript();
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            return NavigationDecision.navigate;
          },
        ),
      );
  }

  void _openBrainForge() {
    if (!mounted) return;
    setState(() => _activePage = _ActivePage.brainforge);
  }

  Future<void> _openInggrisku({bool forceReload = false}) async {
    if (!mounted) return;
    await _ensureAndroidMicPermission(showPromptIfDenied: false);
    if (!mounted) return;
    setState(() {
      _activePage = _ActivePage.inggrisku;
      _inggriskuShowHeader = true;
    });
    if (!_inggriskuLoadedOnce || forceReload) {
      _inggriskuLoadedOnce = true;
      _inggriskuController.loadRequest(Uri.parse(_currentInggriskuUrl));
    }
  }

  void _goToDashboard() {
    if (!mounted) return;
    setState(() {
      _activePage = _ActivePage.dashboard;
      _inggriskuShowHeader = true;
    });
  }

  Future<void> _injectFullscreenCanvasScript() async {
    try {
      await _inggriskuController.runJavaScript('''
        (function() {
          if (window.__bfCanvasHooked) {
            if (typeof window.__bfApplyFullscreen === 'function') {
              window.__bfApplyFullscreen();
            }
            return;
          }
          window.__bfCanvasHooked = true;

          function applyFullscreen() {
            try {
              if (!document.getElementById('bf-fullscreen-canvas-style')) {
                var st = document.createElement('style');
                st.id = 'bf-fullscreen-canvas-style';
                st.textContent =
                  'html, body {' +
                  '  background: #ffffff !important;' +
                  '  margin: 0 !important;' +
                  '  padding: 0 !important;' +
                  '  width: 100vw !important;' +
                  '  height: 100vh !important;' +
                  '  overflow: hidden !important;' +
                  '}' +
                  'iframe[src*="scf.usercontent"],' +
                  'iframe[src*="usercontent.goog"],' +
                  'share-viewer iframe,' +
                  'immersive-panel iframe,' +
                  'main iframe {' +
                  '  position: fixed !important;' +
                  '  top: 0 !important;' +
                  '  left: 0 !important;' +
                  '  right: 0 !important;' +
                  '  bottom: 0 !important;' +
                  '  width: 100vw !important;' +
                  '  height: 100vh !important;' +
                  '  max-width: 100vw !important;' +
                  '  max-height: 100vh !important;' +
                  '  min-width: 100vw !important;' +
                  '  min-height: 100vh !important;' +
                  '  margin: 0 !important;' +
                  '  padding: 0 !important;' +
                  '  border: 0 !important;' +
                  '  border-radius: 0 !important;' +
                  '  box-shadow: none !important;' +
                  '  z-index: 2147483640 !important;' +
                  '  background: #ffffff !important;' +
                  '}';
                (document.head || document.documentElement).appendChild(st);
              }

              var iframes = document.querySelectorAll('iframe');
              var targetIframe = null;
              for (var i = 0; i < iframes.length; i++) {
                var src = (iframes[i].getAttribute('src') || '');
                if (src.indexOf('scf.usercontent') !== -1 ||
                    src.indexOf('usercontent.goog') !== -1 ||
                    iframes[i].clientHeight > 180) {
                  targetIframe = iframes[i];
                  break;
                }
              }

              if (targetIframe) {
                var allowAttr = targetIframe.getAttribute('allow') || '';
                if (allowAttr.indexOf('microphone') === -1) {
                  targetIframe.setAttribute(
                    'allow',
                    (allowAttr ? allowAttr + '; ' : '') + 'microphone *; autoplay *'
                  );
                }
                var props = {
                  'position': 'fixed',
                  'top': '0',
                  'left': '0',
                  'right': '0',
                  'bottom': '0',
                  'width': '100vw',
                  'height': '100vh',
                  'max-width': '100vw',
                  'max-height': '100vh',
                  'min-width': '100vw',
                  'min-height': '100vh',
                  'margin': '0',
                  'padding': '0',
                  'border': '0',
                  'border-radius': '0',
                  'box-shadow': 'none',
                  'z-index': '2147483640',
                  'background': '#ffffff'
                };
                for (var k in props) {
                  targetIframe.style.setProperty(k, props[k], 'important');
                }

                var p = targetIframe.parentElement;
                while (p && p !== document.documentElement) {
                  p.style.setProperty('transform', 'none', 'important');
                  p.style.setProperty('filter', 'none', 'important');
                  p.style.setProperty('contain', 'none', 'important');
                  p.style.setProperty('clip-path', 'none', 'important');
                  p.style.setProperty('border-radius', '0', 'important');
                  p.style.setProperty('overflow', 'visible', 'important');
                  p.style.setProperty('background', '#ffffff', 'important');
                  p.style.setProperty('margin', '0', 'important');
                  p.style.setProperty('padding', '0', 'important');
                  p.style.setProperty('max-width', '100vw', 'important');
                  p.style.setProperty('max-height', '100vh', 'important');
                  p = p.parentElement;
                }
              }

              var nodes = document.querySelectorAll('header, footer, a, button, div, span');
              for (var j = 0; j < nodes.length; j++) {
                var el = nodes[j];
                if (targetIframe && el.contains(targetIframe)) continue;
                var txt = (el.innerText || '').trim();
                if (txt === 'Report unsafe content' ||
                    txt === 'Try Gemini Canvas' ||
                    txt === 'Gemini') {
                  var box = el.closest('header, footer, [role="banner"], [role="contentinfo"]') || el;
                  if (!targetIframe || !box.contains(targetIframe)) {
                    box.style.setProperty('display', 'none', 'important');
                  }
                }
              }
            } catch (_) {}
          }

          window.__bfApplyFullscreen = applyFullscreen;
          applyFullscreen();
          setInterval(applyFullscreen, 350);
          if (window.MutationObserver) {
            new MutationObserver(applyFullscreen).observe(document.documentElement, {
              childList: true,
              subtree: true
            });
          }
        })();
      ''');
    } catch (_) {}
  }

  Future<bool> _handleBrainForgeInnerBack() async {
    try {
      final result = await _brainForgeController.runJavaScriptReturningResult('''
        (function() {
          var customSelect = document.querySelector('.custom-select-panel:not([hidden])');
          if (customSelect) {
            if (typeof closeAllCustomSelects === 'function') {
              closeAllCustomSelects();
            } else {
              customSelect.hidden = true;
            }
            return 'closed';
          }
          var topicPanel = document.getElementById('topic-browser-panel');
          if (topicPanel && !topicPanel.hidden) {
            if (typeof closeTopicBrowser === 'function') {
              closeTopicBrowser();
            } else {
              topicPanel.hidden = true;
            }
            return 'closed';
          }
          var modal = document.querySelector('.modal-backdrop:not([hidden])');
          if (modal) {
            modal.hidden = true;
            return 'closed';
          }
          var ws = document.getElementById('workspace-view');
          if (ws && ws.classList.contains('active')) {
            var weblab = document.getElementById('weblab-panel');
            if (weblab && !weblab.hidden) {
              var promptTab = document.getElementById('tab-prompt-btn');
              if (promptTab) promptTab.click();
              window.scrollTo(0, 0);
              return 'tab';
            }
            var backBtn = document.getElementById('back-to-dashboard-btn');
            if (backBtn) backBtn.click();
            window.scrollTo(0, 0);
            return 'dashboard';
          }
          return 'exit';
        })();
      ''');
      final str = result.toString().replaceAll('"', '');
      if ((str == 'tab' || str == 'dashboard') && mounted) {
        setState(() => _brainForgeScrollY = 0);
      }
      return str == 'closed' || str == 'tab' || str == 'dashboard';
    } catch (_) {
      return false;
    }
  }

  Future<void> _showExitConfirmationDialog() async {
    if (!mounted) return;
    final shouldExit = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          titlePadding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
          title: Row(
            children: [
              const Expanded(
                child: Text(
                  'Keluar Aplikasi?',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                icon: const Icon(Icons.close, color: Color(0xFFDC2626), size: 22),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFFFEF2F2),
                  side: const BorderSide(color: Color(0xFFFECACA)),
                ),
                tooltip: 'Batal',
              ),
            ],
          ),
          content: const Text(
            'Apakah kamu yakin ingin keluar dari aplikasi?',
            style: TextStyle(fontSize: 14.5, color: Color(0xFF475569)),
          ),
          actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          actions: [
            OutlinedButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Batal'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Ya, Keluar'),
            ),
          ],
        );
      },
    );

    if (shouldExit == true && mounted) {
      SystemNavigator.pop();
    }
  }

  Future<void> _openDualSettings() async {
    final micGranted =
        await _permChannel.invokeMethod<bool>('hasMicPermission') ?? false;
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _DualSettingsScreen(
          hideGeminiWrapper: _hideGeminiWrapper,
          useShortUrl: _useShortUrl,
          initialMicGranted: micGranted,
          onToggleHideWrapper: (val) {
            setState(() => _hideGeminiWrapper = val);
            if (_inggriskuLoadedOnce) {
              _inggriskuController.reload();
            }
          },
          onToggleShortUrl: (val) {
            setState(() => _useShortUrl = val);
            if (_inggriskuLoadedOnce) {
              _inggriskuController.loadRequest(Uri.parse(_currentInggriskuUrl));
            }
          },
          onClearInggriskuSession: () async {
            await WebViewCookieManager().clearCookies();
            await _inggriskuController.clearLocalStorage();
            await _inggriskuController.clearCache();
            if (_inggriskuLoadedOnce) {
              _inggriskuController.loadRequest(Uri.parse(_currentInggriskuUrl));
            }
          },
          onRequestMicPermission: () => _ensureAndroidMicPermission(),
          onOpenAppSettings: () => _permChannel.invokeMethod('openAppSettings'),
          onOpenBrainForgeProfile: () async {
            Navigator.pop(context);
            _openBrainForge();
            await _brainForgeController.runJavaScript(
              "document.getElementById('open-profile-btn')?.click();",
            );
          },
          onOpenBrainForgeDiagnostic: () async {
            Navigator.pop(context);
            _openBrainForge();
            await _brainForgeController.runJavaScript(
              "document.getElementById('open-diagnostic-btn')?.click();",
            );
          },
          onReloadBrainForge: () {
            Navigator.pop(context);
            _brainForgeController.loadFlutterAsset('assets/brainforge.html');
            _openBrainForge();
          },
          onReloadInggrisku: () {
            Navigator.pop(context);
            _openInggrisku(forceReload: true);
          },
          onOpenInggriskuExternal: () {
            launchUrl(Uri.parse(_currentInggriskuUrl), mode: LaunchMode.externalApplication);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (_activePage == _ActivePage.inggrisku) {
          if (await _inggriskuController.canGoBack()) {
            await _inggriskuController.goBack();
            return;
          }
          if (!context.mounted) return;
          final now = DateTime.now();
          if (_lastInggriskuBackSwipe == null ||
              now.difference(_lastInggriskuBackSwipe!) > const Duration(seconds: 2)) {
            _lastInggriskuBackSwipe = now;
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(
                const SnackBar(
                  content: Text(
                    'Gunakan tombol ← di dalam Inggrisku untuk mundur, atau ketuk 🏠 Home / swipe lagi untuk ke Dashboard',
                  ),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            return;
          }
          _lastInggriskuBackSwipe = null;
          _goToDashboard();
          return;
        }
        if (_activePage == _ActivePage.brainforge) {
          if (await _brainForgeController.canGoBack()) {
            await _brainForgeController.goBack();
            return;
          }
          if (await _handleBrainForgeInnerBack()) {
            return;
          }
          _goToDashboard();
          return;
        }
        await _showExitConfirmationDialog();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F7FA),
        body: SafeArea(
          child: IndexedStack(
            index: _activePage.index,
            children: [
              _buildMathAllStyleDashboard(),
              _buildFloatingBackWebView(
                controller: _brainForgeController,
                onBackPressed: _goToDashboard,
              ),
              _buildWebViewWithSlimBackHeader(
                controller: _inggriskuController,
                onBackPressed: _goToDashboard,
                progress: _inggriskuProgress,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMathAllStyleDashboard() {
    return Stack(
      children: [
        Positioned.fill(
          child: CustomPaint(
            painter: _GridPainter(),
          ),
        ),
        Positioned(
          top: 12,
          left: 16,
          child: InkWell(
            onTap: _openDualSettings,
            borderRadius: BorderRadius.circular(22),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.grey.shade300),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.settings_rounded, size: 18, color: Color(0xFF1565C0)),
                  SizedBox(width: 6),
                  Text(
                    'Settings',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1565C0),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'BRAINFORGE',
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1565C0),
                      letterSpacing: 2.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 3,
                    width: 64,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1565C0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'PILIH APLIKASI LATIHAN',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                      letterSpacing: 1.3,
                    ),
                  ),
                  const SizedBox(height: 44),
                  _AppLaunchCard(
                    label: 'BRAINFORGE.AI',
                    subtitle: '20 Game Otak, Bicara & Analisis Teks',
                    icon: Icons.psychology_rounded,
                    color: const Color(0xFF1565C0),
                    onTap: _openBrainForge,
                  ),
                  const SizedBox(height: 18),
                  _AppLaunchCard(
                    label: 'INGGRISKU.AI',
                    subtitle: 'Bro Arule • Speaking, Grammar & Listening',
                    icon: Icons.record_voice_over_rounded,
                    color: const Color(0xFF283593),
                    onTap: () => _openInggrisku(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // BrainForge.AI: Fullscreen WebView + tombol Back mengambang ikut terscroll bersama header navbar
  Widget _buildFloatingBackWebView({
    required WebViewController controller,
    required VoidCallback onBackPressed,
  }) {
    final topOffset = 8.0 - _brainForgeScrollY.clamp(0.0, 64.0);
    final isHidden = _brainForgeScrollY > 44.0;
    return Stack(
      children: [
        Positioned.fill(
          child: WebViewWidget(controller: controller),
        ),
        Positioned(
          top: topOffset,
          left: 8,
          child: IgnorePointer(
            ignoring: isHidden,
            child: Opacity(
              opacity: (1.0 - (_brainForgeScrollY / 48.0)).clamp(0.0, 1.0),
              child: Material(
                color: Colors.white.withValues(alpha: 0.90),
                shape: const CircleBorder(),
                elevation: 2,
                shadowColor: Colors.black26,
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onBackPressed,
                  child: const SizedBox(
                    width: 36,
                    height: 36,
                    child: Icon(
                      Icons.home_rounded,
                      size: 20,
                      color: Color(0xFF1565C0),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Inggrisku.AI: Header Back 28dp otomatis tersembunyi saat scroll ke bawah & muncul lagi saat swipe ke atas
  Widget _buildWebViewWithSlimBackHeader({
    required WebViewController controller,
    required VoidCallback onBackPressed,
    int? progress,
  }) {
    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          height: _inggriskuShowHeader ? 28.0 : 0.0,
          width: double.infinity,
          clipBehavior: Clip.hardEdge,
          decoration: const BoxDecoration(
            color: Color(0xFFF8FAFC),
            border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 0.8)),
          ),
          child: SingleChildScrollView(
            physics: const NeverScrollableScrollPhysics(),
            child: SizedBox(
              height: 28,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: InkWell(
                    onTap: onBackPressed,
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.home_rounded,
                            size: 14,
                            color: Color(0xFF1565C0),
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Home',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1565C0),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        if (progress != null && progress > 0 && progress < 100)
          LinearProgressIndicator(
            value: progress / 100.0,
            minHeight: 2,
            color: const Color(0xFF1565C0),
            backgroundColor: const Color(0xFFE2E8F0),
          ),
        Expanded(
          child: Listener(
            behavior: HitTestBehavior.translucent,
            onPointerDown: (_) => _inggriskuDragDy = 0,
            onPointerUp: (_) => _inggriskuDragDy = 0,
            onPointerCancel: (_) => _inggriskuDragDy = 0,
            onPointerMove: (PointerMoveEvent event) {
              _inggriskuDragDy += event.delta.dy;
              if (_inggriskuDragDy < -14 && _inggriskuShowHeader) {
                setState(() => _inggriskuShowHeader = false);
              } else if (_inggriskuDragDy > 20 && !_inggriskuShowHeader) {
                setState(() => _inggriskuShowHeader = true);
              }
            },
            child: WebViewWidget(controller: controller),
          ),
        ),
      ],
    );
  }
}

class _DualSettingsScreen extends StatefulWidget {
  final bool hideGeminiWrapper;
  final bool useShortUrl;
  final bool initialMicGranted;
  final ValueChanged<bool> onToggleHideWrapper;
  final ValueChanged<bool> onToggleShortUrl;
  final Future<void> Function() onClearInggriskuSession;
  final Future<bool> Function() onRequestMicPermission;
  final VoidCallback onOpenAppSettings;
  final VoidCallback onOpenBrainForgeProfile;
  final VoidCallback onOpenBrainForgeDiagnostic;
  final VoidCallback onReloadBrainForge;
  final VoidCallback onReloadInggrisku;
  final VoidCallback onOpenInggriskuExternal;

  const _DualSettingsScreen({
    required this.hideGeminiWrapper,
    required this.useShortUrl,
    required this.initialMicGranted,
    required this.onToggleHideWrapper,
    required this.onToggleShortUrl,
    required this.onClearInggriskuSession,
    required this.onRequestMicPermission,
    required this.onOpenAppSettings,
    required this.onOpenBrainForgeProfile,
    required this.onOpenBrainForgeDiagnostic,
    required this.onReloadBrainForge,
    required this.onReloadInggrisku,
    required this.onOpenInggriskuExternal,
  });

  @override
  State<_DualSettingsScreen> createState() => _DualSettingsScreenState();
}

class _DualSettingsScreenState extends State<_DualSettingsScreen> {
  late bool _hideWrapper;
  late bool _shortUrl;
  late bool _micGranted;

  @override
  void initState() {
    super.initState();
    _hideWrapper = widget.hideGeminiWrapper;
    _shortUrl = widget.useShortUrl;
    _micGranted = widget.initialMicGranted;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1565C0),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Settings Aplikasi',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionHeader(
            icon: Icons.psychology_rounded,
            title: 'Pengaturan BrainForge.AI',
            subtitle: '20 Game Kognitif, Bicara & Analisis Teks',
            color: const Color(0xFF1565C0),
          ),
          Card(
            color: Colors.white,
            elevation: 0.5,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline_rounded, color: Color(0xFF1565C0)),
                  title: const Text('Profil, Bahasa & Gaya Coach', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Atur nama, target bahasa (ID/EN), & persona AI'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: widget.onOpenBrainForgeProfile,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.medical_services_outlined, color: Color(0xFF1565C0)),
                  title: const Text('Diagnostik Bicara & Program 14 Hari', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Buka panduan kondisi bicara & kurikulum 14 hari'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: widget.onOpenBrainForgeDiagnostic,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.refresh_rounded, color: Color(0xFF1565C0)),
                  title: const Text('Muat Ulang BrainForge.AI', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Segarkan tampilan bundle lokal BrainForge'),
                  onTap: widget.onReloadBrainForge,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          _buildSectionHeader(
            icon: Icons.record_voice_over_rounded,
            title: 'Pengaturan Inggrisku.AI',
            subtitle: 'Bro Arule Web • Akses Login, Mikrofon & Layar',
            color: const Color(0xFF283593),
          ),
          Card(
            color: Colors.white,
            elevation: 0.5,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: Icon(
                    _micGranted ? Icons.mic_rounded : Icons.mic_off_rounded,
                    color: _micGranted ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                  ),
                  title: const Text('Izin Mikrofon Android', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(_micGranted ? 'Aktif — Siap dipakai di WebView' : 'Belum diizinkan — Ketuk tombol untuk mengizinkan'),
                  trailing: _micGranted
                      ? const Icon(Icons.check_circle, color: Color(0xFF16A34A))
                      : FilledButton.tonal(
                          onPressed: () async {
                            final ok = await widget.onRequestMicPermission();
                            if (mounted) setState(() => _micGranted = ok);
                            if (!ok) widget.onOpenAppSettings();
                          },
                          child: const Text('Izinkan'),
                        ),
                  onTap: () => widget.onOpenAppSettings(),
                ),
                const Divider(height: 1),
                const ListTile(
                  leading: Icon(Icons.verified_user_outlined, color: Color(0xFF283593)),
                  title: Text('Akun Inggrisku.AI Pribadi', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    'Masuk menggunakan akun Inggrisku.AI milik Anda sendiri langsung di halaman login Inggrisku.AI.',
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626)),
                  title: const Text('Reset Sesi / Logout Inggrisku.AI', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Hapus cookie & sesi login di perangkat ini untuk ganti akun'),
                  onTap: () async {
                    await widget.onClearInggriskuSession();
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✅ Sesi login Inggrisku.AI telah direset.'),
                        duration: Duration(seconds: 2),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.fullscreen_rounded, color: Color(0xFF283593)),
                  title: const Text('Mode Fullscreen (Hapus Banner Gemini)', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Sembunyikan header Gemini, Report unsafe content & Try Gemini Canvas'),
                  value: _hideWrapper,
                  onChanged: (val) {
                    setState(() => _hideWrapper = val);
                    widget.onToggleHideWrapper(val);
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.link_rounded, color: Color(0xFF283593)),
                  title: const Text('Gunakan Shortlink Share', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(_shortUrl ? kInggriskuShortUrl : kInggriskuFullUrl),
                  value: _shortUrl,
                  onChanged: (val) {
                    setState(() => _shortUrl = val);
                    widget.onToggleShortUrl(val);
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.refresh_rounded, color: Color(0xFF283593)),
                  title: const Text('Muat Ulang Inggrisku.AI', style: TextStyle(fontWeight: FontWeight.w600)),
                  onTap: widget.onReloadInggrisku,
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.open_in_new_rounded, color: Color(0xFF64748B)),
                  title: const Text('Buka di Browser Eksternal', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Cadangan jika ingin membuka di Chrome luar aplikasi'),
                  onTap: widget.onOpenInggriskuExternal,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 10),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AppLaunchCard extends StatefulWidget {
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _AppLaunchCard({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  State<_AppLaunchCard> createState() => _AppLaunchCardState();
}

class _AppLaunchCardState extends State<_AppLaunchCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: child,
      ),
      child: GestureDetector(
        onTapDown: (_) => _animController.forward(),
        onTapUp: (_) {
          _animController.reverse();
          widget.onTap();
        },
        onTapCancel: () => _animController.reverse(),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 18),
          decoration: BoxDecoration(
            color: widget.color,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.35),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, color: Colors.white, size: 40),
              const SizedBox(height: 10),
              Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 1.8,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                widget.subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.88),
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1565C0).withValues(alpha: 0.045)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;
    const spacing = 28.0;
    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) => false;
}
