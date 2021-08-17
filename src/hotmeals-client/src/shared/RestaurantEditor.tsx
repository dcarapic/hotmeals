import React, { useRef, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Col, Form, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";
import { useAbortable } from "../util/abortable";

// TODO: Add validation messages to form


/** Modal dialog for editing a restaurant. */
const RestaurantEditor = (props: {
    /** Restaurant to edit. */
    restaurant: model.RestaurantDTO;
    /** Invoked when user cancels the editing */
    onCancel: () => void;
    /** Invoked after the chagnes have been saved. The restaurant provided is a new object from server. */
    onSaved: (savedRestaurant: model.RestaurantDTO) => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const [validated, setValidated] = useState(false);
    const abort = useAbortable();

    const formRef = useRef<any>();
    const saveChanges = async () => {
        if(!formRef.current)
            return;
        if (formRef.current.checkValidity() === false) {
            setValidated(true);
            return;
        }
        let name: string = formRef.current.formName.value;
        let description: string = formRef.current.formDescription.value;
        let phoneNumber: string = formRef.current.formPhone.value;
        setSubmitting(true);
        setServerResponse(null);

        if (!props.restaurant.id) {
            let req: api.NewRestaurantRequest = { name, description, phoneNumber };
            let response = await api.restaurantAdd(req, abort);
            if (response.isAborted) return;
            setSubmitting(false);
            setServerResponse(response);
            if (response.ok && response.result) {
                props.onSaved(response.result.restaurant);
            }
        } else {
            let req: api.UpdateRestaurantRequest = { name, description, phoneNumber };
            let response = await api.restaurantUpdate(props.restaurant.id, req, abort);
            if (response.isAborted) return;
            setSubmitting(false);
            setServerResponse(response);
            if (response.ok && response.result) {
                props.onSaved(response.result.restaurant);
            }
        }
    };

    return (
        <Modal show={true} backdrop="static">
            <Modal.Header closeButton={false}>
                <Modal.Title>Edit restaurant </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Col className="d-grid">
                    <Form onSubmit={saveChanges} noValidate validated={validated} ref={formRef}>
                        <Form.Group className="mb-2" controlId="formName">
                            <Form.Label>Restaurant name</Form.Label>
                            <Form.Control
                                type="text"
                                maxLength={100}
                                readOnly={submitting}
                                defaultValue={props.restaurant?.name}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                maxLength={2000}
                                readOnly={submitting}
                                defaultValue={props.restaurant?.description}
                                rows={3}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-2" controlId="formPhone">
                            <Form.Label>Phone number</Form.Label>
                            <Form.Control
                                type="phone"
                                maxLength={50}
                                readOnly={submitting}
                                defaultValue={props.restaurant?.phoneNumber}
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
export default RestaurantEditor;
