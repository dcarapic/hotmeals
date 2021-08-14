import React, { Fragment, useEffect, useState } from "react";
import { Row, Col, Alert, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import MenuItemEditor from "../shared/MenuItemEditor";
import MenuItemDeleter from "../shared/MenuItemDeleter";
import Loading from "../shared/Loading";
import NotFoundPage from "./NotFoundPage";

const MenuItemList = (props: {
    menuItems: model.MenuItemDTO[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}) => {
    return (
        <Fragment>
            {props.menuItems.map((mi, i) => {
                return (
                    <Fragment key={mi.menuItemId}>
                        {i > 0 && <hr />}
                        <MenuItemListItem menuItem={mi} onEdit={props.onEdit} onDelete={props.onDelete} />
                    </Fragment>
                );
            })}
        </Fragment>
    );
};
const MenuItemListItem = (props: {
    menuItem: model.MenuItemDTO;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}) => {
    return (
        <Row className="d-grid">
                <Col>{props.menuItem.name} <strong className='text-success'>{props.menuItem.price} €</strong></Col>
            <Col>
                <i>{props.menuItem.description}</i>
            </Col>
            <Col>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="success"
                    onClick={() => props.onEdit && props.onEdit(props.menuItem.menuItemId)}>
                    Edit item
                </Button>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="danger"
                    onClick={() => props.onDelete && props.onDelete(props.menuItem.menuItemId)}>
                    Delete
                </Button>
            </Col>
        </Row>
    );
};

const OwnerRestaurantMenuPage = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const abort = ui.useAbortable();
    const { restaurantId } = useParams<any>();
    if (!restaurantId) return <NotFoundPage />;

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [menuItems, setMenuItems] = useState<model.MenuItemDTO[]>([]);
    const [editedMenuItem, setEditedMenuItem] = useState<model.MenuItemDTO | null>(null);
    const [menuItemToDelete, setMenuItemToDelete] = useState<model.MenuItemDTO | null>(null);

    const loadMenuItems = async () => {
        msgs.clearMessage();
        setLoading(true);
        let response = await api.menuItemFetchAll(restaurantId, abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            setMenuItems(response.result.menuItems);
            setTitle(`Menu for '${response.result.restaurantName}'`)
        } else {
            setLoading(false);
            setMenuItems([]);
            setTitle("")
        }
    };

    useEffect(() => {
        loadMenuItems();
    }, []);

    const createNewMenuItem = () => {
        setEditedMenuItem({ menuItemId: "", restaurantId, name: "", description: "", price: 0 });
    };
    const editMenuItem = (id: string) => {
        let r = menuItems.find((x) => x.menuItemId === id);
        setEditedMenuItem(r!);
    };
    const deleteMenuItem = (id: string) => {
        let r = menuItems.find((x) => x.menuItemId === id);
        setMenuItemToDelete(r!);
    };

    const onEditCanceled = () => setEditedMenuItem(null);
    const onEditSaved = (savedMenuItem: model.MenuItemDTO) => {
        // Replace the edited menu item with the updated copy
        let copy = [...menuItems];
        if(editedMenuItem!.menuItemId)
            copy[copy.indexOf(editedMenuItem!)] = savedMenuItem;
        else
            copy.push(savedMenuItem);
        // Clear edited menu item, this will hide the dialog
        setEditedMenuItem(null);
        setMenuItems(copy);
    };

    const onDeleteCanceled = () => setMenuItemToDelete(null);
    const onDeleted = () => {
        // Remove the menu item
        let copy = [...menuItems];
        copy.splice(copy.indexOf(menuItemToDelete!), 1);
        // Clear deleted menu item, this will hide the dialog
        setMenuItemToDelete(null);
        setMenuItems(copy);
    };

    return (
        <Fragment>
            <h3 className="text-center p-2">{title}</h3>
            {loading && (
                <Row className="justify-content-center">
                    <Col xs="3">
                        <Loading showLabel />
                    </Col>
                </Row>
            )}
            {!loading && (
                <Fragment>
                    <MenuItemList menuItems={menuItems} onEdit={editMenuItem} onDelete={deleteMenuItem} />
                    <Alert show={menuItems.length === 0} variant="primary">
                        You do not have any menu items at the moment.
                    </Alert>
                </Fragment>
            )}
            <Button onClick={createNewMenuItem} className="mt-3" disabled={loading}>
                Create new menu item
            </Button>
            {editedMenuItem && <MenuItemEditor menuItem={editedMenuItem} onCancel={onEditCanceled} onSaved={onEditSaved} />}
            {menuItemToDelete && <MenuItemDeleter menuItem={menuItemToDelete} onCancel={onDeleteCanceled} onDeleted={onDeleted} />}
        </Fragment>
    );
});
export default OwnerRestaurantMenuPage;
