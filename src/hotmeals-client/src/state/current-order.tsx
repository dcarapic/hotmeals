import React, { useContext, useState } from "react";
import * as model from "./model";

/**
 * Current order state object.
 */
export type CurrentOrder = {
    /** Current order, if null then there is no current order */
    order: model.NewOrder | null;
    /**
     * Creates a new current order for the given restaurant.
     */
    createOrder: (restaurantId: string, restaurantName: string) => void;
    /**
     * Clears current order
     */
    removeOrder: () => void;
    /**
     * Adds/updates/removes order item
     */
    setMenuItem: (item: model.MenuItemBase, quantity: number) => void;
};

const CurrentOrderContext = React.createContext<CurrentOrder>({
    order: null,
    createOrder: () => {},
    removeOrder: () => {},
    setMenuItem: () => {},
});
const useCurrentOrder = () => useContext(CurrentOrderContext);

/**
 * Provider for the current order state. Should be placed as a root parent for children which are affected by current order.
 */
const CurrentOrderProvider = (props : React.PropsWithChildren<any>) => {
    const createOrder = (restaurantId: string, restaurantName: string) => {
        const order: model.NewOrder = { restaurantId, restaurantName, items: [], total: 0 };
        setCurrentOrder({ order, createOrder, removeOrder, setMenuItem });
    };
    const removeOrder = () => {
        setCurrentOrder({ order: null, createOrder, removeOrder, setMenuItem });
    };
    const setMenuItem = (item: model.MenuItemBase, quantity: number) => {
        setCurrentOrder((currentOrder: CurrentOrder) => {
            // If current order was cleared or new order for another restaurant has started then do not do anything
            if (!currentOrder.order || currentOrder.order.restaurantId !== item.restaurantId) return currentOrder;
            // Do not allow invalid quantities
            if (quantity < 0 || quantity > 99) return currentOrder;

            // Create a new order or make a copy of existing order where the new menu item is either 
            // updated / added or removed
            let orderItems: model.NewOrderItem[] = [];
            if (currentOrder.order) orderItems = [...currentOrder.order.items];

            let orderItem = orderItems.find(
                (x) => x.menuItemId == item.menuItemId && x.restaurantId == item.restaurantId
            );
            if (orderItem) {
                if (quantity === 0) orderItems.splice(orderItems.indexOf(orderItem));
                else orderItems[orderItems.indexOf(orderItem)] = { ...orderItem, quantity: quantity };
            } else {
                if (quantity !== 0)
                    orderItems.push({ menuItemId: item.menuItemId, restaurantId: item.restaurantId, name: item.name, description: item.description, price: item.price, quantity: quantity  });
            }
            let total = 0
            if(orderItems.length > 0)
                total = orderItems.map(x=>x.price * x.quantity).reduce((prev, next) => prev + next)
            total = Math.round((total + Number.EPSILON) * 100) / 100
            let newOrder : model.NewOrder = { ...currentOrder.order, items: orderItems, total};

            return { order: newOrder, createOrder, removeOrder, setMenuItem };
        });
    };
    let [currentOrder, setCurrentOrder] = useState<CurrentOrder>({
        order: null,
        createOrder,
        removeOrder,
        setMenuItem,
    });

    return (
            <CurrentOrderContext.Provider value={currentOrder}>
                {props.children}
            </CurrentOrderContext.Provider>
    );
};

export { CurrentOrderProvider, CurrentOrderContext, useCurrentOrder };
