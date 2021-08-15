import React from "react";
import { Badge, Button, Form } from "react-bootstrap";
import * as model from "../state/model";
import { useCurrentUser } from "../state/user";

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

const OrderMenuItem = (props: {
    item: model.NewOrderItem | model.OrderItemDTO;
    disabled?: boolean;
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
                    style={{ maxWidth: "2em" }}
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

const OrderHistoryItem = (props: { hist: model.OrderHistoryDTO }) => {
    let color = "text-body";
    switch (props.hist.status) {
        case "Canceled":
            color = "text-danger";
            break;
        case "Received":
            color = "text-success";
            break;
    }
    let changedAt = new Date(Date.parse(props.hist.changedAt));
    return (
        <div className={`col d-flex justify-content-between ${color}`}>
            <span>{props.hist.status}</span>
            <i>{changedAt.toLocaleString()}</i>
        </div>
    );
};

const OrderDetails = (props: {
    order: model.NewOrder | model.OrderDTO;
    disabled?: boolean;
    onQuantityChanged?: (menuItemId: string, quantity: number) => void;
    onRequestStatusChange?: (status: model.OrderStatus) => void;
    onRequestBlockUser?: (email: string) => void;
}) => {
    const user = useCurrentUser();

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
                <div className="ms-1 mb-1 d-flex justify-content-end mb-1">
                    {/* If new order then customer can cancel order before placement */}
                    {!isPlacedOrder(props.order) && !user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            className="me-1"
                            variant="secondary"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Canceled");
                            }}>
                            Cancel order
                        </Button>
                    )}
                    {/* If placed order then customer can cancel */}
                    {hasStatus(props.order, "Placed") && !user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            className="me-1"
                            variant="danger"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Canceled");
                            }}>
                            Cancel order
                        </Button>
                    )}{" "}
                    {/* If new order then customer can place an order */}
                    {!isPlacedOrder(props.order) && !user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            className="me-1"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Placed");
                            }}>
                            Place order
                        </Button>
                    )}
                    {/* If placed order then owner can accept */}
                    {hasStatus(props.order, "Placed") && user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            variant="success"
                            className="me-1"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Accepted");
                            }}>
                            Accept order
                        </Button>
                    )}
                    {/* If accepted order then owner can ship */}
                    {hasStatus(props.order, "Accepted") && user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="me-1"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Shipped");
                            }}>
                            Order shipped
                        </Button>
                    )}
                    {/* If shipped order then owner can deliver */}
                    {hasStatus(props.order, "Shipped") && user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="me-1"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Delivered");
                            }}>
                            Delivered
                        </Button>
                    )}
                    {/* If delivered order then customer can received */}
                    {hasStatus(props.order, "Delivered") && !user.userData?.isRestaurantOwner && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="me-1"
                            onClick={() => {
                                if (!props.disabled && props.onRequestStatusChange)
                                    props.onRequestStatusChange("Received");
                            }}>
                            Received
                        </Button>
                    )}
                    {/* If owner then owner can block user */}
                    {user.userData?.isRestaurantOwner && isPlacedOrder(props.order) && (
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

export { OrderMenuItem, OrderDetails };
