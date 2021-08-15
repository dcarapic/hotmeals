import React, { useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";

const OrderStatusChanger = (props: {
    order: model.OrderDTO;
    status: model.OrderStatus;
    onCancel: () => void;
    onStatusChanged: (order: model.OrderDTO) => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const abort = ui.useAbortable();

    const updateStatus = async () => {
        setSubmitting(true);
        setServerResponse(null);

        let response = await api.orderUpdateStatus(props.order.orderId, props.status, abort);
        if (response.isAborted) return;
        setSubmitting(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            props.onStatusChanged(response.result.order);
        }
    };

    return (
        <Modal show={true} backdrop="static">
            <Modal.Header closeButton={false}>
                <Modal.Title>Update order</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to change the order status to <strong>{props.status}</strong>?
                <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" disabled={submitting} onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant={props.status === 'Canceled'? 'danger' : 'primary' } type="submit" loading={submitting} onClick={updateStatus}>
                    Confirm
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default OrderStatusChanger;
