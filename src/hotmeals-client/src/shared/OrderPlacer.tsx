import React, { useCallback, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";
import { OrderDetails } from "./OrderDetails";
import Loading from "./Loading";
import { useNotificationSubscription } from "../util/ws-notifications";

const OrderPlacer = (props: {
    order: model.NewOrder;
    onCancelPlacing: () => void;
    onStoppedWaitingForConfirmation: (order: model.OrderDTO) => void;
    onOrderPlaced: (order: model.OrderDTO) => void;
    onOrderCanceled: (order: model.OrderDTO) => void;
    onOrderConfirmed: (order: model.OrderDTO) => void;
}) => {
    const [placing, setPlacing] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [placedOrder, setPlacedOrder] = useState<model.OrderDTO>();
    const [waitingConfirmation, setWaitingConfirmation] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);

    const abort = ui.useAbortable();

    const placeOrder = async () => {
        setPlacing(true);
        setServerResponse(null);
        let req: api.PlaceOrderRequest = {
            restaurantId: props.order.restaurantId,
            items: props.order.items.map((x) => ({ menuItemId: x.menuItemId, price: x.price, quantity: x.quantity })),
        };
        let response = await api.orderPlace(req, abort);
        if (response.isAborted) return;
        setPlacing(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            setPlacedOrder(response.result.order);
            setWaitingConfirmation(true);
            props.onOrderPlaced(response.result.order);
        }
    };

    const cancelOrder = async () => {
        if (!waitingConfirmation) {
            props.onCancelPlacing();
            return;
        }
        setCanceling(true);
        setServerResponse(null);
        let response = await api.orderUpdateStatus(placedOrder!.orderId, "Canceled", abort);
        if (response.isAborted) return;
        setCanceling(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            setPlacedOrder(response.result.order);
            props.onOrderCanceled(response.result.order);
        }
    };

    const stopWaitingForConfirmation = () => {
        props.onStoppedWaitingForConfirmation(placedOrder!);
    };

    useNotificationSubscription(
        "OrderUpdated",
        (order: model.OrderDTO) => {
            console.log(
                `OrderPlacer: Order updated ${order.orderId} (waiting: ${waitingConfirmation} for order ${placedOrder?.orderId} ) `
            );
            if (waitingConfirmation && placedOrder && placedOrder.orderId === order.orderId)
                props.onStoppedWaitingForConfirmation(placedOrder!);
        },
        [props, waitingConfirmation, placedOrder]
    );

    return (
        <Modal show={true} backdrop="static">
            <Modal.Header closeButton={false}>
                <Modal.Title>Place my order</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!waitingConfirmation ? (
                    <OrderDetails order={props.order} disabled={true} />
                ) : (
                    <div className="row justify-content-center">
                        <div className="col-8">
                            <Loading showLabel label="Please wait until the restaurant confirms your order ..." />
                        </div>
                    </div>
                )}
                <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                {waitingConfirmation && (
                    <Button variant="secondary" onClick={stopWaitingForConfirmation}>
                        Close
                    </Button>
                )}
                <LoadingButton
                    variant={waitingConfirmation ? "danger" : "secondary"}
                    loading={canceling}
                    disabled={placing || canceling}
                    onClick={cancelOrder}>
                    Cancel
                </LoadingButton>
                {!waitingConfirmation && (
                    <LoadingButton variant="danger" loading={placing} onClick={placeOrder}>
                        Place order
                    </LoadingButton>
                )}
            </Modal.Footer>
        </Modal>
    );
};
export default OrderPlacer;
