import * as signalR from "@microsoft/signalr";
import { DependencyList, useEffect } from "react";
import * as api from "./api";
import * as jwt from "../state/jwt-token";
import { onUserChanged } from "../state/user";

let connectionOpts : signalR.IHttpConnectionOptions = {
    accessTokenFactory: () => {
        return jwt.getJWTToken().token || "";
    }
}

// SignalR connection object
let connection = new signalR.HubConnectionBuilder()
    .withUrl(api.serverUrl + "api/ws", connectionOpts)
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect([0, 2, 5, 5, 10, 30, 60, 60, 60, 60, 60])
    .build();

/** Connects the client to the server web-socket hub. */    
const connect = async () => {
    console.log(`ws: connect()`);
    // If already connecting then ignore connect attempt
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

/** Disconnects the client from the server web-socket hub. */
const disconnect = () => {
    console.log(`ws: disconnect()`);
    connection.stop();
};

/** Event types which can be subscribed to */
export type EventType = "OrderUpdated";
/** Represents subscription identifier used to unsubscribe from the event */
export type SubscriptionId = object;
/** Method which handles the event. */
export type EventHandler<T> = (message: T) => void;

type EventSubscription = {
    type: EventType;
    handler: (...args: any[]) => void;
    subscriptionId: object;
};

const subscriptions: EventSubscription[] = [];

/** Subscribe to the given event type. */
const onEvent = (type: EventType, handler: (message: any) => void): SubscriptionId => {
    let subscriptionId = {};
    subscriptions.push({ type, handler, subscriptionId });
    connection.on(type, handler);
    console.log(`ws: subscribed to ${type}`);
    return subscriptionId;
};

/** Unsubscribes from the given event type. */
const offEvent = (subscriptionId: SubscriptionId) => {
    console.log(`ws: trying to unsubscribe ${subscriptionId}`);
    let reg = subscriptions.find((x) => x.subscriptionId === subscriptionId);
    if (!reg) return;
    console.log(`ws: unsubscribed from ${reg.type}`);
    subscriptions.splice(subscriptions.indexOf(reg), 1);
    connection.off(reg.type, reg.handler);
};

/** React hook which performs automatic subscription and un-subscription from an event of the given type.*/
const useEvent = <T>(
    type: EventType,
    handler: EventHandler<T>,
    deps: DependencyList
) => {
    useEffect(() => {
        const subId = onEvent(type, handler);
        return () => offEvent(subId);
    }, deps);
};

// Here we immediately subscribe to current application user change so when user is set then we automatically connect the socket.
// When the user is cleared we will automatically disconnect
onUserChanged((user) => {
    if(user) {
        connect();
    } else {
        disconnect();
    }
})

export { onEvent, offEvent, useEvent };
