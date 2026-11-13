import '../../../core/api/contracts.dart';
import '../../../core/api/transport.dart';

/// One explicit logical operation in the current account session. Never retry
/// an ambiguous result with new payload/key. No automatic POST retries.
class PendingOrderCommand {
  PendingOrderCommand(Json payload)
    : body = Map.unmodifiable(payload),
      key = commandId();
  final Json body;
  final String key;
  bool uncertain = false;
}
