import React, { Fragment, useEffect, useState } from "react";
import { Alert, Button, Col,  Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../util/model";
import routes from "../routes";
import Loading from "../shared/Loading";
import RestaurantEditor from "../shared/RestaurantEditor";
import RestaurantDeleter from "../shared/RestaurantDeleter";


const RestaurantList = (props: {
    restaurants: model.RestaurantDTO[];
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
    restaurant: model.RestaurantDTO;
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

const OwnerRestaurants = ui.withMessageContainer(() => {
    const msgs = ui.useMessageService();
    const history = useHistory();
    const abort = ui.useAbortable();

    const [loading, setLoading] = useState(true);
    const [restaurants, setRestaurants] = useState<model.RestaurantDTO[]>([]);
    const [editedRestaurant, setEditedRestaurant] = useState<model.RestaurantDTO | null>(null);
    const [restaurantToDelete, setRestaurantToDelete] = useState<model.RestaurantDTO | null>(null);

    const loadRestaurants = async () => {
        msgs.clearMessage();
        setLoading(true);
        let response = await api.restaurantFetchAll(abort);
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

    const onEditCancel = () => setEditedRestaurant(null);
    const onEditSaved = (savedRestaurant: model.RestaurantDTO) => {
        // Replace the edited restaurant with the updated copy
        let copy = [...restaurants]
        if(editedRestaurant!.id)
            copy[copy.indexOf(editedRestaurant!)] = savedRestaurant
        else
            copy.push(savedRestaurant);
        // Clear edited restaurant, this will hide the dialog
        setEditedRestaurant(null);
        setRestaurants(copy);
    };

    const onDeleteCancel = () => setRestaurantToDelete(null);
    const onDeleted = () => {
        // Remove the restaurant
        let copy = [...restaurants]
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
            {editedRestaurant && <RestaurantEditor restaurant={editedRestaurant} onCancel={onEditCancel} onSaved={onEditSaved} />}
            {restaurantToDelete && <RestaurantDeleter restaurant={restaurantToDelete} onCancel={onDeleteCancel} onDeleted={onDeleted} />}
        </Fragment>
    );
});
export default OwnerRestaurants;
