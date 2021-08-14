import React, { Fragment as div } from "react";
import { Button, Form } from "react-bootstrap";
import * as model from "../state/model";

const NewOrderMenuItem = (props: {
    item: model.NewOrderItem;
    disabled?: boolean;
    onQuantityChanged?: (menuItemId: string, quantity: number) => void;
}) => {
    return (
        <div className="mb-1 px-2">
            <div className="col d-flex justify-content-end align-items-center">
                <span className="me-auto">{props.item.name}</span>
                {!props.disabled && (
                    <Button
                        size="sm"
                        variant="success"
                        className="me-1"
                        onClick={() =>
                            props.onQuantityChanged &&
                            props.item.quantity > 0 &&
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
                {!props.disabled && (
                    <Button
                        size="sm"
                        variant="success"
                        className="me-1"
                        onClick={() =>
                            props.onQuantityChanged &&
                            props.item.quantity < 99 &&
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

const NewOrder = (props: {
    order: model.NewOrder;
    disabled?: boolean;
    onQuantityChanged?: (id: string, quantity: number) => void;
    onRequestPlaceOrder?: () => void;
    onRequestCancelOrder?: () => void;
}) => {
    return (
        <div>
            <div className="bg-secondary text-white mb-1 p-2">
                <strong>{props.order.restaurantName}</strong>
            </div>
            <div>
                {props.order.items.map((x) => (
                    <NewOrderMenuItem
                        key={x.menuItemId}
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
                <div className="ms-1 mb-1 d-flex justify-content-end">
                    <Button
                        size="sm"
                        className="me-1"
                        onClick={() => {
                            if (!props.disabled && props.onRequestPlaceOrder) props.onRequestPlaceOrder();
                        }}>
                        Place order
                    </Button>
                    <Button
                        size="sm"
                        className="me-1"
                        variant="warning"
                        onClick={() => {
                            if (!props.disabled && props.onRequestCancelOrder) props.onRequestCancelOrder();
                        }}>
                        Cancel order
                    </Button>
                </div>
            )}
        </div>
    );
};

export { NewOrderMenuItem, NewOrder };
