import { useState, useEffect } from "react";

/** Object holding information about the current user. */
export type ApplicationUser = {
    email: string;
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    password: string;
    isRestaurantOwner: boolean;
};

/** Method which handles the user change event. */
export type UserChangeHandler = (newUser: ApplicationUser | null) => void;
/** Represents subscription identifier used to unsubscribe from the user change event */
export type SubscriptionId = object;

type UserChangeSubscription = {
    handler: UserChangeHandler;
    subscriptionId: object;
};

// Contains information about the current user
let userContainer: { currentUser: ApplicationUser | null } = { currentUser: null };

// User change event subscriptions.
let subscriptions: UserChangeSubscription[] = [];

/** Gets the current user. If there is no current user then null is returned. */
const getCurrentUser = (): ApplicationUser | null => {
    return userContainer.currentUser;
};

/** Sets the current user. */
const setCurrentUser = (user: ApplicationUser) => {
    userContainer.currentUser = user;
    fireUserChanged();
};

/** Clears the current user. */
const clearCurrentUser = () => {
    userContainer.currentUser = null;
    fireUserChanged();
};

// Notifies all subscribers that the current user changed.
const fireUserChanged = () => {
    console.log(`user: user changed`);
    for (let sub of subscriptions) {
        sub.handler(userContainer.currentUser);
    }
};

/** Subscribe to user change */
const onUserChanged = (handler: (newUser: ApplicationUser | null) => void): SubscriptionId => {
    //console.log(`user: subscribed to change`);
    let subscriptionId = {};
    subscriptions.push({ handler, subscriptionId });
    return subscriptionId;
};

/** Unsubscribe to user change */
const offUserChanged = (subscriptionId: SubscriptionId) => {
    //console.log(`user: trying to unsubscribe from user change`);
    let reg = subscriptions.find((x) => x.subscriptionId === subscriptionId);
    if (!reg) return;
    //console.log(`user: unsubscribed from user change`);
    subscriptions.splice(subscriptions.indexOf(reg), 1);
};

/** React hook which returns current user. If the user changes the component is automatically re-rendered. */
const useCurrentUser = () => {
    const [user, setUser] = useState(userContainer.currentUser);
    useEffect(() => {
        const subId = onUserChanged((user) => setUser(user));
        return () => offUserChanged(subId);
    }, []);
    return user;
};

export { getCurrentUser, setCurrentUser, clearCurrentUser, onUserChanged, offUserChanged, useCurrentUser };
