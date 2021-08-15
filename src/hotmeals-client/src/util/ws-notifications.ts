import * as signalR from "@microsoft/signalr";
import { DependencyList, useEffect } from "react";
import * as model from "../state/model";
import * as api from "./api";
import * as jwt from "../state/jwt-token";

let connectionOpts : signalR.IHttpConnectionOptions = {
    accessTokenFactory: () => {
        return jwt.getJWTToken().token || "";
    }
}

let connection = new signalR.HubConnectionBuilder()
    .withUrl(api.serverUrl + "api/ws", connectionOpts)
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect([0, 2, 5, 5, 10, 30, 60, 60, 60, 60, 60])
    .build();

const connect = async () => {
    if (
        connection.state === signalR.HubConnectionState.Connected ||
        connection.state === signalR.HubConnectionState.Connecting ||
        connection.state === signalR.HubConnectionState.Reconnecting
    )
        return;
    try {
        await connection.start();
    } catch (e) {
        console.log(`ws: failed to connect to HotMeals notification system: ${e.message}`);
    }
};

const disconnect = () => {
    connection.stop();
};

export type NotificationType = "OrderUpdated";
export type SubscriptionId = object;
export type NotificationHandler<T> = (message: T) => void;

type NotificationRegistration = {
    type: NotificationType;
    handler: (...args: any[]) => void;
    registrationId: object;
};

const notificationRegistrations: NotificationRegistration[] = [];

const subscribe = (type: NotificationType, handler: (message: any) => void): SubscriptionId => {
    let registrationId = new Object();
    notificationRegistrations.push({ type, handler, registrationId });
    connection.on(type, handler);
    console.log(`ws: subscribed to ${type}`);
    return registrationId;
};

const unSubscribe = (id: SubscriptionId) => {
    console.log(`ws: trying to unsubscribe ${id}`);
    let reg = notificationRegistrations.find((x) => x.registrationId === id);
    if (!reg) return;
    console.log(`ws: unsubscribed from ${reg.type}`);
    notificationRegistrations.splice(notificationRegistrations.indexOf(reg), 1);
    connection.off(reg.type, reg.handler);
};

const subscribeOrderUpdated = (handler: NotificationHandler<model.OrderDTO>): SubscriptionId => {
    return subscribe("OrderUpdated", handler);
};

const useNotificationSubscription = <T>(
    type: NotificationType,
    handler: NotificationHandler<T>,
    deps: DependencyList
) => {
    useEffect(() => {
        const subId = subscribe(type, handler);
        return () => unSubscribe(subId);
    }, deps);
};

export { subscribe, unSubscribe, subscribeOrderUpdated, connect, disconnect, useNotificationSubscription };
