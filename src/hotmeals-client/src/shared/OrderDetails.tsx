import React from "react";
import { Badge, Button, Form } from "react-bootstrap";
import * as model from "../state/model";
import { useCurrentUser } from "../state/user";

/** Displays order information. Used in various combinations. */
const OrderDetails = (props: {
    /** Order to display. Can be a new order to be placed or an already placed order */
    order: model.NewOrder | model.OrderDTO;
    /** True if no action can be performed */
    disabled?: boolean;
    /** Invoked if user changes quantity of a order item. Can only be user for new orders */
    onQuantityChanged?: (menuItemId: string, quantity: number) => void;
    /** Invoked if user requests status change. For new order this means placing the order, for placed orders any of the other statuses are possible depending on the current user role. */
    onRequestStatusChange?: (status: model.OrderStatus) => void;
    /** We are mis-using the order-details to add a button to block a user. This is only possible by owner on a placed order. */
    onRequestBlockUser?: (email: string) => void;
}) => {
    const user = useCurrentUser();

    // If no user then we have been logged out, no need to show anything
    if (user === null) return null;

    return (
        <div>
            <div className="bg-secondary text-white mb-1 p-2 d-flex justify-content-between">
                <strong>{props.order.restaurantName}</strong>
                {isPlacedOrder(props.order) && (
                    <Badge pill bg="light" className="text-dark">
                        {props.order.currentStatus}
                    </Badge>
                )}
            </div>
            <div>
                {props.order.items.map((x) => (
                    <OrderMenuItem
                        key={x.name}
                        item={x}
                        onQuantityChanged={props.onQuantityChanged}
                        disabled={props.disabled}
                    />
                ))}
            </div>
            <div className="d-flex justify-content-end border-top px-2 mb-1">
                <span className="me-auto">Total:</span>
                <strong>{props.order.total} €</strong>
            </div>
            {!props.disabled && (
                <OrderDetailsToolbar
                    order={props.order}
                    disabled={props.disabled}
                    isOwner={user.isRestaurantOwner}
                    onRequestStatusChange={props.onRequestStatusChange}
                    onRequestBlockUser={props.onRequestBlockUser}
                />
            )}
            {isPlacedOrder(props.order) && (
                <div className="border-top px-2 mt-2 pt-1">
                    {props.order.history.map((x) => (
                        <OrderHistoryItem key={x.changedAt.toString()} hist={x} />
                    ))}{" "}
                </div>
            )}
        </div>
    );
};

/** Displays order information. Used in various combinations. */
const OrderDetailsSmall = (props: {
    /** Order to display. Can be a new order to be placed or an already placed order */
    order: model.NewOrder | model.OrderDTO;
    /** True if no action can be performed */
    disabled?: boolean;
    /** Invoked if user requests status change. For new order this means placing the order, for placed orders any of the other statuses are possible depending on the current user role. */
    onRequestStatusChange?: (status: model.OrderStatus) => void;
}) => {
    const user = useCurrentUser();

    // If no user then we have been logged out, no need to show anything
    if (user === null) return null;

    return (
        <div>
            <div className="bg-secondary text-white p-1 d-flex justify-content-between">
                <strong>{props.order.restaurantName}</strong>
                {isPlacedOrder(props.order) && (
                    <Badge pill bg="light" className="text-dark">
                        {props.order.currentStatus}
                    </Badge>
                )}
            </div>
            <div className="px-2 mb-1 d-flex justify-content-between">
                <div className="d-flex flex-wrap">
                    {props.order.items.map((x, i) => (
                        <div key={x.name} className="me-2">
                            <strong>{x.quantity}</strong> x <strong>{x.name} </strong> ({x.price} €)
                        </div>
                    ))}
                </div>
                <div>
                    <strong className="px-2 text-nowrap">{props.order.total} €</strong>
                </div>
            </div>
            {!props.disabled && (
                <OrderDetailsToolbar
                    order={props.order}
                    disabled={props.disabled}
                    isOwner={user.isRestaurantOwner}
                    onRequestStatusChange={props.onRequestStatusChange}
                />
            )}
        </div>
    );
};

const OrderDetailsToolbar = (props: {
    /** Order to display. Can be a new order to be placed or an already placed order */
    order: model.NewOrder | model.OrderDTO;
    /** True if no action can be performed */
    disabled?: boolean;
    /** True if current user is owner */
    isOwner: boolean;
    /** Invoked if user requests status change. For new order this means placing the order, for placed orders any of the other statuses are possible depending on the current user role. */
    onRequestStatusChange?: (status: model.OrderStatus) => void;
    /** We are mis-using the order-details to add a button to block a user. This is only possible by owner on a placed order. */
    onRequestBlockUser?: (email: string) => void;
}) => {
    return (
        <div className="ms-1 mb-1 d-flex justify-content-end mb-1">
            {/* If new order then customer can cancel order before placement */}
            {!isPlacedOrder(props.order) && !props.isOwner && (
                <Button
                    size="sm"
                    className="me-1"
                    variant="secondary"
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Canceled");
                    }}>
                    Cancel order
                </Button>
            )}
            {/* If placed order then customer can cancel */}
            {hasStatus(props.order, "Placed") && !props.isOwner && (
                <Button
                    size="sm"
                    className="me-1"
                    variant="danger"
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Canceled");
                    }}>
                    Cancel order
                </Button>
            )}{" "}
            {/* If new order then customer can place an order */}
            {!isPlacedOrder(props.order) && !props.isOwner && (
                <Button
                    size="sm"
                    className="me-1"
                    disabled={props.order.items.length === 0}
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Placed");
                    }}>
                    Place order
                </Button>
            )}
            {/* If placed order then owner can accept */}
            {hasStatus(props.order, "Placed") && props.isOwner && (
                <Button
                    size="sm"
                    variant="success"
                    className="me-1"
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Accepted");
                    }}>
                    Accept order
                </Button>
            )}
            {/* If accepted order then owner can ship */}
            {hasStatus(props.order, "Accepted") && props.isOwner && (
                <Button
                    size="sm"
                    variant="primary"
                    className="me-1"
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Shipped");
                    }}>
                    Order shipped
                </Button>
            )}
            {/* If shipped order then owner can deliver */}
            {hasStatus(props.order, "Shipped") && props.isOwner && (
                <Button
                    size="sm"
                    variant="primary"
                    className="me-1"
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Delivered");
                    }}>
                    Delivered
                </Button>
            )}
            {/* If delivered order then customer can received */}
            {hasStatus(props.order, "Delivered") && !props.isOwner && (
                <Button
                    size="sm"
                    variant="primary"
                    className="me-1"
                    onClick={() => {
                        if (!props.disabled && props.onRequestStatusChange) props.onRequestStatusChange("Received");
                    }}>
                    Received
                </Button>
            )}
            {/* If owner then owner can block user */}
            {props.isOwner && props.onRequestBlockUser && isPlacedOrder(props.order) && (
                <Button
                    size="sm"
                    variant="warning"
                    className="me-1"
                    onClick={() => {
                        if (!props.disabled && isPlacedOrder(props.order) && props.onRequestBlockUser)
                            props.onRequestBlockUser(props.order.customerEmail);
                    }}>
                    Block customer
                </Button>
            )}
        </div>
    );
};

// TODO: Enlarge the quantity input element (10 does not fit)
// TODO: Enable direct entry of the quantity

/** Displays infomration about new or placed order menu item. For placed orders it also enables the user to add/remove quantity. */
const OrderMenuItem = (props: {
    /** Displayed menu item. */
    item: model.NewOrderItem | model.OrderItemDTO;
    /** If disabled no user action is possible. */
    disabled?: boolean;
    /** Invoked if the user changed the quantity of an order menu item. */
    onQuantityChanged?: (menuItemId: string, quantity: number) => void;
}) => {
    return (
        <div className="mb-1 px-2">
            <div className="col d-flex justify-content-end align-items-center">
                <span className="me-auto">{props.item.name}</span>
                {!props.disabled && !isPlacedOrderItem(props.item) && (
                    <Button
                        size="sm"
                        variant="success"
                        className="me-1"
                        onClick={() =>
                            props.onQuantityChanged &&
                            props.item.quantity > 0 &&
                            !isPlacedOrderItem(props.item) &&
                            props.onQuantityChanged(props.item.menuItemId, props.item.quantity - 1)
                        }>
                        -
                    </Button>
                )}
                <Form.Control
                    className="me-1"
                    min={0}
                    max={99}
                    size="sm"
                    style={{ maxWidth: "2.5em" }}
                    value={props.item.quantity}
                    readOnly
                />
                {!props.disabled && !isPlacedOrderItem(props.item) && (
                    <Button
                        size="sm"
                        variant="success"
                        className="me-1"
                        onClick={() =>
                            props.onQuantityChanged &&
                            props.item.quantity < 99 &&
                            !isPlacedOrderItem(props.item) &&
                            props.onQuantityChanged(props.item.menuItemId, props.item.quantity + 1)
                        }>
                        +
                    </Button>
                )}
                <strong style={{ minWidth: "4em" }} className="text-end">
                    {props.item.price} €
                </strong>
            </div>
            <div>
                <i>{props.item.description}</i>
            </div>
        </div>
    );
};

/** Displays order history item. */
const OrderHistoryItem = (props: {
    /** Order history item */
    hist: model.OrderHistoryDTO;
}) => {
    let color = "text-body";
    switch (props.hist.status) {
        case "Canceled":
            color = "text-danger";
            break;
        case "Received":
            color = "text-success";
            break;
    }
    // The server returns ISO8601 date which we need to parse to display it localized.
    let changedAt = new Date(Date.parse(props.hist.changedAt));
    return (
        <div className={`col d-flex justify-content-between ${color}`}>
            <span>{props.hist.status}</span>
            <i>{changedAt.toLocaleString()}</i>
        </div>
    );
};

// Helper functions which help determine the type of order
function isPlacedOrder(order: any): order is model.OrderDTO {
    return order.orderId !== undefined;
}

function isPlacedOrderItem(item: any): item is model.OrderItemDTO {
    return item.menuItemId === undefined;
}

function hasStatus(order: model.NewOrder | model.OrderDTO, status: model.OrderStatus): boolean {
    if (isPlacedOrder(order) && order.currentStatus === status) return true;
    return false;
}

export { OrderMenuItem, OrderDetails, OrderDetailsSmall };
