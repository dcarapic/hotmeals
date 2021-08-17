import React, { useRef, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Col, Form, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";
import { useAbortable } from "../util/abortable";

// TODO: Add validation messages to form
// TODO: Add price unit to price input

/** Modal dialog for editing restaurant menu items. */
const MenuItemEditor = (props: {
    /** Restaurant menu item */
    menuItem: model.MenuItemDTO;
    /** Invoked if user cancels editing. */
    onCancel: () => void;
    /** Invoked after the menu item was saved. */
    onSaved: (savedMenuItem: model.MenuItemDTO) => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const [validated, setValidated] = useState(false);
    const abort = useAbortable();

    const formRef = useRef<any>();

    const saveChanges = async () => {
        if (formRef.current?.checkValidity() === false) {
            setValidated(true);
            return;
        }
        setValidated(false);
        let name: string = formRef.current?.formName.value;
        let description: string = formRef.current?.formDescription.value;
        let price: number = formRef.current?.formPrice.value;
        setSubmitting(true);
        setServerResponse(null);

        if (!props.menuItem.menuItemId) {
            let req: api.NewMenuItemRequest = { name, description, price };
            let response = await api.menuItemAdd(props.menuItem.restaurantId, req, abort);
            if (response.isAborted) return;
            setSubmitting(false);
            setServerResponse(response);
            if (response.ok && response.result) {
                props.onSaved(response.result.menuItem);
            }
        } else {
            let req: api.UpdateMenuItemRequest = { name, description, price };
            let response = await api.menuItemUpdate(props.menuItem.menuItemId, props.menuItem.restaurantId, req, abort);
            if (response.isAborted) return;
            setSubmitting(false);
            setServerResponse(response);
            if (response.ok && response.result) {
                props.onSaved(response.result.menuItem);
            }
        }
    };

    return (
        <Modal show={true} backdrop="static">
            <Modal.Header closeButton={false}>
                <Modal.Title>Edit menuItem </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Col className="d-grid">
                    <Form onSubmit={saveChanges} noValidate validated={validated} ref={formRef}>
                        <Form.Group className="mb-2" controlId="formName">
                            <Form.Label>Menu name</Form.Label>
                            <Form.Control
                                type="text"
                                maxLength={100}
                                readOnly={submitting}
                                defaultValue={props.menuItem?.name}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                maxLength={2000}
                                readOnly={submitting}
                                defaultValue={props.menuItem?.description}
                                rows={3}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2" controlId="formPrice">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                min={0}
                                max={99999}
                                readOnly={submitting}
                                step=".01"
                                defaultValue={props.menuItem?.price}
                                required
                            />
                        </Form.Group>
                    </Form>
                    <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
                </Col>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" disabled={submitting} onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="primary" type="submit" loading={submitting} onClick={saveChanges}>
                    Save
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default MenuItemEditor;
