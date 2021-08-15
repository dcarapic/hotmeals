import React from "react";
import * as model from "../state/model";
import {  useCurrentUser } from "../state/user";
import { useEvent } from "../util/ws-events";
import { useToastMessageService } from "../util/ui";


/** Component whose sole purpose is to alert the user in case an order update is detected via web-socket events. */
const OrderNotificationManager = () => {
    const currentUser = useCurrentUser();
    const toast = useToastMessageService();

    useEvent("OrderUpdated", (order: model.OrderDTO) => {
        console.log(`TopNav: Order updated ${order.orderId}`);
        if (!currentUser) return;
        let caption = `Order - ${order.currentStatus}`;
        let description = `Order was marked as ${order.currentStatus}`;
        let variant = "light";

        if (currentUser.isRestaurantOwner) {
            if (order.currentStatus === "Placed") {
                caption = "New order!";
                description = `You have received new order for your restaurant ${order.restaurantName}.`;
            } else if (order.currentStatus === "Canceled") {
                caption = "Order has been canceled";
                description = `Unfortunately one of the orders for your restaurant ${order.restaurantName} has been canceled.`;
                variant = "warning";
            } else if (order.currentStatus === "Received") {
                caption = "Order completed";
                description = `Customer has marked your order as received. The order is completed!`;
                variant = "success";
            }
        } else {
            if (order.currentStatus === "Accepted") {
                caption = `Order - ${order.currentStatus}`;
                description = `Restaurant has accepted your order! You will get notified as the order status changes.`;
                variant = "success";
            } else if (order.currentStatus === "Delivered") {
                caption = `Order - ${order.currentStatus}`;
                description = `Restaurant has marked your order as ${order.currentStatus}. You should now mark it as received!`;
                variant = "success";
            }
        }
        toast.showToast({ caption, description, variant, createdAt: new Date() });
    }, [currentUser, toast]);    

    return <div/>;
};
export default OrderNotificationManager;


