import React, { useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";

/** Modal dialog for deleting a restaurant */
const RestaurantDeleter = (props: {
    /** Restaurant to delete */
    restaurant: model.RestaurantDTO;
    /** Invoked when user cancels the deletion */
    onCancel: () => void;
    /** Invoked after the restaurant has been deleted */
    onDeleted: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const abort = ui.useAbortable();

    const deleteRestaurant = async () => {
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
        <Modal show={true} backdrop="static">
            <Modal.Header closeButton={false}>
                <Modal.Title>Delete restaurant </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to delete your restaurant "{props.restaurant?.name}"?
                <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" disabled={submitting} onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="danger" type="submit" loading={submitting} onClick={deleteRestaurant}>
                    Delete
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default RestaurantDeleter;
