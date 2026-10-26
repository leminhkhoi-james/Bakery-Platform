import { ORDER_STATUS } from '../../../constants/orderStatus'

// Admin fixtures use progressStage for the whole order lifecycle (including
// baking and completion), independently of escrowStatus and deliveryVehicle.
// A status explicitly supplied by the order service always takes precedence.
export function getAdminOrderStatus(order) {
  if (order?.status != null) return order.status
  return ORDER_STATUS[order?.progressStage?.toUpperCase()]
}
