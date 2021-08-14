import React, { Fragment, useEffect, useState } from "react";
import { Alert, Button, Col, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import routes from "../routes";
import Loading from "../shared/Loading";
import RestaurantEditor from "../shared/RestaurantEditor";
import RestaurantDeleter from "../shared/RestaurantDeleter";


const RestaurantListItem = (props: {
    restaurant: model.RestaurantDTO;
    onEdit?: (id: string) => void;
    onEditMenu?: (id: string) => void;
    onViewOrders?: (id: string) => void;
    onDelete?: (id: string) => void;
}) => {
    return (
        <div className="mb-3">
            <div>
                <strong>{props.restaurant.name}</strong>
            </div>
            <div>
                <i>{props.restaurant.description}</i>
            </div>
            <div>
                {props.restaurant.phoneNumber}
            </div>
            <div className="d-flex flex-wrap">
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
            </div>
        </div>
    );
};

const OwnerRestaurants = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const history = useHistory();
    const abort = ui.useAbortable();

    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [restaurants, setRestaurants] = useState<model.RestaurantDTO[]>([]);
    const [editedRestaurant, setEditedRestaurant] = useState<model.RestaurantDTO | null>(null);
    const [restaurantToDelete, setRestaurantToDelete] = useState<model.RestaurantDTO | null>(null);

    const loadRestaurants = async () => {
        msgs.clearMessage();
        setLoading(true);
        let response = await api.restaurantFetchAll(1, abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        setLoaded(true);
        if (response.ok && response.result) {
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
        setEditedRestaurant({ id: "", name: "", description: "", phoneNumber: "" });
    };
    const editRestaurant = (id: string) => {
        let r = restaurants.find((x) => x.id === id);
        setEditedRestaurant(r!);
    };
    const deleteRestaurant = (id: string) => {
        let r = restaurants.find((x) => x.id === id);
        setRestaurantToDelete(r!);
    };

    const editMenu = (id: string) => {
        history.push(routes.getOwnerRestaurantMenu(id));
    };
    const viewOrders = (id: string) => {
        history.push(routes.getOwnerOrdersForRestaurant(id));
    };

    const onEditCanceled = () => setEditedRestaurant(null);
    const onEditSaved = (savedRestaurant: model.RestaurantDTO) => {
        // Replace the edited restaurant with the updated copy
        let copy = [...restaurants];
        if (editedRestaurant!.id) copy[copy.indexOf(editedRestaurant!)] = savedRestaurant;
        else copy.push(savedRestaurant);
        // Clear edited restaurant, this will hide the dialog
        setEditedRestaurant(null);
        setRestaurants(copy);
    };

    const onDeleteCanceled = () => setRestaurantToDelete(null);
    const onDeleted = () => {
        // Remove the restaurant
        let copy = [...restaurants];
        copy.splice(copy.indexOf(restaurantToDelete!), 1);
        // Clear deleted restaurant, this will hide the dialog
        setRestaurantToDelete(null);
        setRestaurants(copy);
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
            {loaded && (
                <div className="row mb-2">
                    {restaurants.map((r, i) => {
                        return (
                            <div className="col-12" key={r.id}>
                                <RestaurantListItem
                                    restaurant={r}
                                    onEdit={editRestaurant}
                                    onViewOrders={viewOrders}
                                    onEditMenu={editMenu}
                                    onDelete={deleteRestaurant}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
            <Alert show={loaded && restaurants.length === 0} variant="info">
                You do not have any restaurants at the moment.
            </Alert>
            <Button onClick={createNewRestaurant} className="mt-3" disabled={loading}>
                Create new restaurant
            </Button>
            {editedRestaurant && (
                <RestaurantEditor restaurant={editedRestaurant} onCancel={onEditCanceled} onSaved={onEditSaved} />
            )}
            {restaurantToDelete && (
                <RestaurantDeleter restaurant={restaurantToDelete} onCancel={onDeleteCanceled} onDeleted={onDeleted} />
            )}
        </Fragment>
    );
});
export default OwnerRestaurants;
