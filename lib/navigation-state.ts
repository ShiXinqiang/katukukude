import type { View } from "./data";
export type RouteState = { view: View; conversationId:string; selectedProductId: string; searchKeyword: string; ordersFilter: string; serviceName: string; serviceParent: string | null; checkoutTotal: number; scrollY: number; depth: number };
export const initialRoute: RouteState = { view: "home", conversationId:"", selectedProductId: "", searchKeyword: "", ordersFilter: "all", serviceName: "外卖", serviceParent: null, checkoutTotal: 0, scrollY: 0, depth: 0 };
export function nextRoute(current: RouteState, view: View, patch: Partial<RouteState> = {}, replace = false): RouteState {
 return { ...current, ...patch, view, scrollY: 0, depth: patch.depth ?? (replace ? current.depth : current.depth + 1) };
}
