import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:brainforge_app/main.dart';

void main() {
  test('BrainForgeApp and hub configuration smoke test', () {
    const app = BrainForgeApp();
    expect(app, isA<StatelessWidget>());
    expect(kInggriskuFullUrl, startsWith('https://gemini.google.com/share/'));
    expect(kInggriskuShortUrl, startsWith('https://share.gemini.google/'));
  });
}
