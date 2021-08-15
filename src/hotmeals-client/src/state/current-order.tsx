import {  useEffect, useState } from "react";
import * as model from "./model";

/** Method which handles the order change event. */
export type OrderChangedHandler = (newOrder: model.NewOrder | null) => void;
/** Represents subscription identifier used to unsubscribe from the order change event */
export type SubscriptionId = object;

type OrderChangeSubscription = {
    handler: OrderChangedHandler;
    subscriptionId: object;
};

// Contains information about the current order
let orderContainer: { currentOrder: model.NewOrder | null } = { currentOrder: null };

// Order change event subscriptions.
let subscriptions: OrderChangeSubscription[] = [];

/** Gets the current order. If there is no current order then null is returned. */
const getCurrentOrder = (): model.NewOrder | null => {
    return orderContainer.currentOrder;
};

/** Creates  current order. */
const createCurrentOrder = (restaurantId: string, restaurantName: string) => {
    orderContainer.currentOrder = { restaurantId, restaurantName, items: [], total: 0 };
    fireOrderChanged();
};

/** Removes the current order. */
const removeCurrentOrder = () => {
    orderContainer.currentOrder = null;
    fireOrderChanged();
};

/** Sets the menu item of the current order */
const setCurrentOrderMenuItem = (item: model.MenuItemBase, quantity: number) => {
    // If current order was cleared or new order for another restaurant has started then do not do anything
    if (!orderContainer.currentOrder || orderContainer.currentOrder.restaurantId !== item.restaurantId)
        return;
    // Do not allow invalid quantities
    if (quantity < 0 || quantity > 99) 
        return;

    // Create a new order or make a copy of existing order where the new menu item is either
    // updated / added or removed
    let orderItems: model.NewOrderItem[] = [];
    if (orderContainer.currentOrder) orderItems = [...orderContainer.currentOrder.items];

    let orderItem = orderItems.find((x) => x.menuItemId === item.menuItemId && x.restaurantId === item.restaurantId);
    if (orderItem) {
        if (quantity === 0) orderItems.splice(orderItems.indexOf(orderItem));
        else orderItems[orderItems.indexOf(orderItem)] = { ...orderItem, quantity: quantity };
    } else {
        if (quantity !== 0)
            orderItems.push({
                menuItemId: item.menuItemId,
                restaurantId: item.restaurantId,
                name: item.name,
                description: item.description,
                price: item.price,
                quantity: quantity,
            });
    }
    let total = 0;
    if (orderItems.length > 0) total = orderItems.map((x) => x.price * x.quantity).reduce((prev, next) => prev + next);
    total = Math.round((total + Number.EPSILON) * 100) / 100;
    orderContainer.currentOrder = { ...orderContainer.currentOrder, items: orderItems, total };
    fireOrderChanged();
};

// Notifies all subscribers that the current order changed.
const fireOrderChanged = () => {
    console.log(`current-order: order changed`);
    for (let sub of subscriptions) {
        sub.handler(orderContainer.currentOrder);
    }
};

/** Subscribe to order change */
const onOrderChanged = (handler: (newOrder: model.NewOrder | null) => void): SubscriptionId => {
    //console.log(`current-order: subscribed to change`);
    let subscriptionId = {};
    subscriptions.push({ handler, subscriptionId });
    return subscriptionId;
};

/** Unsubscribe to order change */
const offOrderChanged = (subscriptionId: SubscriptionId) => {
    let reg = subscriptions.find((x) => x.subscriptionId === subscriptionId);
    if (!reg) return;
    //console.log(`current-order: unsubscribed from order change`);
    subscriptions.splice(subscriptions.indexOf(reg), 1);
};

/** React hook which returns current order. If the order changes the component is automatically re-rendered. */
const useCurrentOrder = () => {
    const [order, setOrder] = useState(orderContainer.currentOrder);
    useEffect(() => {
        const subId = onOrderChanged((order) => setOrder(order));
        return () => offOrderChanged(subId);
    }, []);
    return order;
};

export { getCurrentOrder, createCurrentOrder, removeCurrentOrder, setCurrentOrderMenuItem, onOrderChanged, offOrderChanged, useCurrentOrder };
