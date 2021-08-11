import React, { Fragment, useEffect, useRef, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import {
    RestaurantDTO,
    restaurantFetchAll,
    useAbortable,
    restaurantUpdate,
    UpdateRestaurantRequest,
    NewRestaurantRequest,
    restaurantAdd,
    ServerResponse,
    DeleteRestaurantRequest,
    restaurantDelete,
} from "../util/api";
import { MessageServiceContainer, useMessageService, withMessageContainer } from "../util/ui";
import routes from "../routeConfig";
import Loading from "../shared/Loading";
import { LoadingButton } from "../shared/LoadingButton";

const RestaurantList = (props: {
    restaurants: RestaurantDTO[];
    onEdit?: (id: string) => void;
    onEditMenu?: (id: string) => void;
    onViewOrders?: (id: string) => void;
    onDelete?: (id: string) => void;
}) => {
    return (
        <Fragment>
            {props.restaurants.map((r, i) => {
                return (
                    <Fragment key={r.id}>
                        {i > 0 && <hr />}
                        <RestaurantListItem
                            restaurant={r}
                            onEdit={props.onEdit}
                            onEditMenu={props.onEditMenu}
                            onViewOrders={props.onViewOrders}
                            onDelete={props.onDelete}
                        />
                    </Fragment>
                );
            })}
        </Fragment>
    );
};
const RestaurantListItem = (props: {
    restaurant: RestaurantDTO;
    onEdit?: (id: string) => void;
    onEditMenu?: (id: string) => void;
    onViewOrders?: (id: string) => void;
    onDelete?: (id: string) => void;
}) => {
    return (
        <Row className="d-grid">
            <Col>{props.restaurant.name}</Col>
            <Col>
                <i>{props.restaurant.description}</i>
            </Col>
            <Col>☎{props.restaurant.phoneNumber}</Col>
            <Col>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="success"
                    onClick={() => props.onEdit && props.onEdit(props.restaurant.id)}>
                    Edit restaurant information
                </Button>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="success"
                    onClick={() => props.onEditMenu && props.onEditMenu(props.restaurant.id)}>
                    Edit menu
                </Button>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="success"
                    onClick={() => props.onViewOrders && props.onViewOrders(props.restaurant.id)}>
                    View orders
                </Button>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="danger"
                    onClick={() => props.onDelete && props.onDelete(props.restaurant.id)}>
                    Delete restaurant
                </Button>
            </Col>
        </Row>
    );
};

const RestaurantEditor = (props: {
    restaurant: RestaurantDTO | null;
    onCancel: () => void;
    onSaved: (savedRestaurant: RestaurantDTO) => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<ServerResponse<any> | null>(null);
    const [validated, setValidated] = useState(false);
    const abort = useAbortable();

    const formRef = useRef<any>();

    // Clear message in case restaurant changes
    useEffect(() => {
        setServerResponse(null);
    }, [props.restaurant]);

    const onSave = async () => {
        if (formRef.current?.checkValidity() === false) {
            setValidated(true);
            return;
        }
        let name: string = formRef.current?.formName.value;
        let description: string = formRef.current?.formDescription.value;
        let phoneNumber: string = formRef.current?.formPhone.value;
        setSubmitting(true);
        setServerResponse(null);

        if (props.restaurant?.id === "") {
            let req: NewRestaurantRequest = { name, description, phoneNumber };
            let response = await restaurantAdd(req, abort);
            if (response.isAborted) return;
            setSubmitting(false);
            setServerResponse(response);
            if (response.ok && response.result) {
                props.onSaved(response.result.restaurant);
            }
        } else {
            let req: UpdateRestaurantRequest = { id: props.restaurant!.id, name, description, phoneNumber };
            let response = await restaurantUpdate(req, abort);
            if (response.isAborted) return;
            setSubmitting(false);
            setServerResponse(response);
            if (response.ok && response.result) {
                props.onSaved(response.result.restaurant);
            }
        }
    };

    return (
        <Modal onHide={props.onCancel} show={!!props.restaurant}>
            <Modal.Header closeButton>
                <Modal.Title>Edit restaurant </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Col className="d-grid">
                    <Form onSubmit={onSave} noValidate validated={validated} ref={formRef}>
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
                    <MessageServiceContainer serverResponse={serverResponse} />
                </Col>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="primary" type="submit" loading={submitting} onClick={onSave}>
                    Save
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};


const RestaurantDeleter = (props: {
    restaurant: RestaurantDTO | null;
    onCancel: () => void;
    onDeleted: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<ServerResponse<any> | null>(null);
    const abort = useAbortable();

    // Clear message in case restaurant changes
    useEffect(() => {
        setServerResponse(null);
    }, [props.restaurant]);

    const onDelete = async () => {
        setSubmitting(true);
        setServerResponse(null);

        let req: DeleteRestaurantRequest = { id: props.restaurant!.id };
        let response = await restaurantDelete(req, abort);
        if (response.isAborted) return;
        setSubmitting(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            props.onDeleted();
        }
    };

    return (
        <Modal onHide={props.onCancel} show={!!props.restaurant}>
            <Modal.Header closeButton>
                <Modal.Title>Delete restaurant </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to delete your restaurant "{props.restaurant?.name}"?
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

const OwnerRestaurants = withMessageContainer(() => {
    const msgs = useMessageService();
    const history = useHistory();
    const abort = useAbortable();

    const [loading, setLoading] = useState(true);
    const [restaurants, setRestaurants] = useState<RestaurantDTO[]>([]);
    const [editedRestaurant, setEditedRestaurant] = useState<RestaurantDTO | null>(null);
    const [restaurantToDelete, setRestaurantToDelete] = useState<RestaurantDTO | null>(null);

    const loadRestaurants = async () => {
        msgs.clearMessage();
        setLoading(true);
        let response = await restaurantFetchAll(abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            console.log(JSON.stringify(response.result.restaurants));
            setRestaurants(response.result.restaurants);
        } else {
            setLoading(false);
            setRestaurants([]);
        }
    };

    useEffect(() => {
        loadRestaurants();
    }, []);

    const createNewRestaurant = () => {
        setEditedRestaurant({ id: "", name: "New restaurant", description: "", phoneNumber: "" });
    };
    const editRestaurant = (id: string) => {
        let r = restaurants.find((x) => x.id === id);
        setEditedRestaurant(r!);
    };

    const editMenu = (id: string) => {
        history.push(routes.getOwnerRestaurantMenu(id));
    };
    const viewOrders = (id: string) => {
        history.push(routes.getOwnerOrdersForRestaurant(id));
    };
    const deleteRestaurant = (id: string) => {
        let r = restaurants.find((x) => x.id === id);
        setRestaurantToDelete(r!);
    };

    const onEditCancel = () => setEditedRestaurant(null);
    const onEditSaved = (savedRestaurant: RestaurantDTO) => {
        // Clear edited restaurant, this will hide the dialog
        setEditedRestaurant(null);
        // Reload the list
        loadRestaurants();
    };

    const onDeleted = () => {
        // Clear edited restaurant, this will hide the dialog
        setRestaurantToDelete(null);
        // Reload the list
        loadRestaurants();
    };

    return (
        <Fragment>
            <h3 className="text-center p-2">Your restaurants</h3>
            {loading && (
                <Row className="justify-content-center">
                    <Col xs="3">
                        <Loading showLabel />
                    </Col>
                </Row>
            )}
            {!loading && (
                <Fragment>
                    <RestaurantList
                        restaurants={restaurants}
                        onEdit={editRestaurant}
                        onViewOrders={viewOrders}
                        onEditMenu={editMenu}
                        onDelete={deleteRestaurant}
                    />
                    <Alert show={restaurants.length == 0} variant="primary">
                        You do not have any restaurants at the moment.
                    </Alert>
                </Fragment>
            )}
            <Button onClick={createNewRestaurant} className="mt-3" disabled={loading}>
                Create new restaurant
            </Button>
            <RestaurantEditor restaurant={editedRestaurant} onCancel={onEditCancel} onSaved={onEditSaved} />
            <RestaurantDeleter restaurant={restaurantToDelete} onCancel={onEditCancel} onDeleted={onDeleted} />
        </Fragment>
    );
});
export default OwnerRestaurants;
