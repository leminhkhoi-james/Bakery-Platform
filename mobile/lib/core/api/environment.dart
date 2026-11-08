import 'package:flutter/foundation.dart';

import 'contracts.dart';

enum ApiService {
  identity,
  bakery,
  subscription,
  marketplace,
  order,
  chat,
  cakeAi,
}

/// Public origins only. Empty release defaults require explicit HTTPS endpoints.
class ApiEnvironment {
  ApiEnvironment({
    required this.identity,
    required this.bakery,
    required this.subscription,
    this.marketplace,
    this.order,
    this.chat,
    this.cakeAi,
  }) {
    for (final value in [
      identity,
      bakery,
      subscription,
      marketplace,
      order,
      chat,
      cakeAi,
    ].whereType<Uri>()) {
      if (value.userInfo.isNotEmpty ||
          value.hasQuery ||
          value.hasFragment ||
          value.path != '' && value.path != '/' ||
          !(value.scheme == 'https' ||
              kDebugMode &&
                  value.scheme == 'http' &&
                  [
                    '127.0.0.1',
                    'localhost',
                    '10.0.2.2',
                  ].contains(value.host))) {
        throw ArgumentError(
          'Cần public HTTPS origin; HTTP chỉ dùng loopback ở debug.',
        );
      }
    }
  }
  final Uri identity, bakery, subscription;
  final Uri? marketplace, order, chat, cakeAi;
  static Uri? optionalOrigin(String value) =>
      value.isEmpty ? null : Uri.parse(value);
  static ApiEnvironment configured() => ApiEnvironment(
    marketplace: optionalOrigin(
      const String.fromEnvironment('MARKETPLACE_URL'),
    ),
    order: optionalOrigin(const String.fromEnvironment('ORDER_URL')),
    chat: optionalOrigin(const String.fromEnvironment('CHAT_URL')),
    cakeAi: optionalOrigin(const String.fromEnvironment('CAKE_AI_URL')),
    identity: Uri.parse(
      const String.fromEnvironment(
        'IDENTITY_URL',
        defaultValue: kDebugMode ? 'http://127.0.0.1:18101' : '',
      ),
    ),
    bakery: Uri.parse(
      const String.fromEnvironment(
        'BAKERY_URL',
        defaultValue: kDebugMode ? 'http://127.0.0.1:18102' : '',
      ),
    ),
    subscription: Uri.parse(
      const String.fromEnvironment(
        'SUBSCRIPTION_URL',
        defaultValue: kDebugMode ? 'http://127.0.0.1:18104' : '',
      ),
    ),
  );
  Uri origin(ApiService service) => switch (service) {
    ApiService.identity => identity,
    ApiService.bakery => bakery,
    ApiService.subscription => subscription,
    ApiService.marketplace => marketplace ?? missingOrigin(),
    ApiService.order => order ?? missingOrigin(),
    ApiService.chat => chat ?? missingOrigin(),
    ApiService.cakeAi => cakeAi ?? missingOrigin(),
  };
  Uri missingOrigin() => throw const ApiFailure(
    503,
    'Dịch vụ chưa được cấu hình trong phiên chạy này. Kiểm tra hướng dẫn khởi chạy Mobile.',
    kind: ApiFailureKind.configuration,
  );
  Uri endpoint(ApiService service, String path, Map<String, Object?> query) {
    if (!path.startsWith('/api/v1/') ||
        path.contains('..') ||
        path.contains('?')) {
      throw ArgumentError('Chỉ hỗ trợ public API v1.');
    }
    return origin(service).replace(
      path: path,
      queryParameters: {
        for (final entry in query.entries)
          if (entry.value != null && entry.value.toString().isNotEmpty)
            entry.key: '${entry.value}',
      },
    );
  }
}
