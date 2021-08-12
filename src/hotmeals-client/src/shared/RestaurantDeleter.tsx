import React, {  useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../util/model";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";


const RestaurantDeleter = (props: {
    restaurant: model.RestaurantDTO;
    onCancel: () => void;
    onDeleted: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const abort = ui.useAbortable();

    const onDelete = async () => {
        setSubmitting(true);
        setServerResponse(null);

        let response = await api.restaurantDelete(props.restaurant!.id, abort);
        if (response.isAborted) return;
        setSubmitting(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            props.onDeleted();
        }
    };

    return (
        <Modal onHide={props.onCancel} show={true}>
            <Modal.Header closeButton>
                <Modal.Title>Delete restaurant </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to delete your restaurant "{props.restaurant?.name}"?
                <ui.MessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="danger" type="submit" loading={submitting} onClick={onDelete}>
                    Delete
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default RestaurantDeleter;
