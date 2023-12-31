import React, { useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";
import { useAbortable } from "../util/abortable";

/** Modal dialog for deleting restaurant menu item. */
const MenuItemDeleter = (props: {
    /** Menu item to delete */
    menuItem: model.MenuItemDTO;
    /** Invoked if user canceled deletion */
    onCancel: () => void;
    /** Invoked after the user has deleted the item */
    onDeleted: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const abort = useAbortable();

    const deleteMenuItem = async () => {
        setSubmitting(true);
        setServerResponse(null);

        let response = await api.menuItemDelete(props.menuItem.menuItemId, props.menuItem.restaurantId, abort);
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
                <Modal.Title>Delete menu item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to delete menu item "{props.menuItem?.name}"?
                <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" disabled={submitting} onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="danger" type="submit" loading={submitting} onClick={deleteMenuItem}>
                    Delete
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default MenuItemDeleter;
