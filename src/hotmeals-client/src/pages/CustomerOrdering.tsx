import React, { Fragment, useCallback, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Col, Row } from "react-bootstrap";
import { getCurrentOrder, removeCurrentOrder, setCurrentOrderMenuItem } from "../state/current-order";
import { Redirect, useHistory } from "react-router-dom";
import routes from "../routes";
import Loading from "../shared/Loading";
import { OrderDetails, OrderMenuItem } from "../shared/OrderDetails";
import OrderPlacer from "../shared/OrderPlacer";

const CustomerOrdering = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const abort = ui.useAbortable();
    const history = useHistory();

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [menuItems, setMenuItems] = useState<model.NewOrderItem[]>([]);

    const loadMenuItems = useCallback(async () => {
        var currentOrder =getCurrentOrder();
        if (!currentOrder) return;
        msgs.clearMessage();
        setLoading(true);
        let response = await api.menuItemFetchAll(currentOrder.restaurantId, abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            let items = response.result.menuItems.map((x) => ({ ...x, quantity: 0 }));
            // After loading the items update their quantity to match ordered quantity
            for (let orderedMenuItem of currentOrder.items) {
                let menuItem = items.find((x) => x.menuItemId === orderedMenuItem.menuItemId);
                if (menuItem) menuItem.quantity = orderedMenuItem.quantity;
            }
            setMenuItems(items);
        } else {
            setLoading(false);
            setMenuItems([]);
        }
    }, [msgs, abort]);

    useEffect(() => {
        loadMenuItems();
    }, [loadMenuItems]);

    
    // If there is no current order then redirect to home page
    let currentOrder = getCurrentOrder();
    if (!currentOrder) return <Redirect to={routes.homePage} />;


    const changeQuantity = (menuItemId: string, quantity: number) => {
        if (!getCurrentOrder()) return;
        let item = menuItems.find((x) => x.menuItemId === menuItemId);
        if (item) {
            setCurrentOrderMenuItem(item, quantity);
            // we also have to update the menu item array to update the counter on the menu item from the selection
            const newItems = [...menuItems];
            newItems[newItems.indexOf(item)] = { ...item, quantity };
            setMenuItems(newItems);
        }
    };

    const changeStatus = (status: model.OrderStatus) => {
        // Status can no longer be changed by the order details
        if (placingOrder) return;
        if (status === "Placed") setPlacingOrder(true);
        else if (status === "Canceled") removeCurrentOrder();
    };

    const onPlacingCanceled = () => setPlacingOrder(false);
    const onStoppedWaitingForConfirmation = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        removeCurrentOrder();
        history.push(routes.ordersActive);
    };

    const onOrderPlaced = (order: model.OrderDTO) => {
        // Do nothing, let the dialog wait for confirmation
    };
    const onOrderCanceled = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        removeCurrentOrder();
    };
    const onOrderConfirmed = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        removeCurrentOrder();
        history.push(routes.ordersActive);
    };

    return (
        <Fragment>
            <div className="sticky-top">
                <h3 className="text-center p-2 hm-sticky-padder">Order your food</h3>
                <div className="border rounded mb-4 bg-light shadow">
                    <OrderDetails
                        order={currentOrder}
                        onQuantityChanged={changeQuantity}
                        onRequestStatusChange={changeStatus}
                    />
                </div>
            </div>
            {loading && (
                <Row className="justify-content-center">
                    <Col xs="3">
                        <Loading showLabel />
                    </Col>
                </Row>
            )}
            {!loading && (
                <div className="row mb-2">
                    {menuItems.map((r, i) => {
                        return (
                            <div className="col-md-6" key={r.menuItemId}>
                                <OrderMenuItem item={r} onQuantityChanged={changeQuantity} />
                            </div>
                        );
                    })}
                </div>
            )}
            {placingOrder && (
                <OrderPlacer
                    order={currentOrder}
                    onCancelPlacing={onPlacingCanceled}
                    onStoppedWaitingForConfirmation={onStoppedWaitingForConfirmation}
                    onOrderPlaced={onOrderPlaced}
                    onOrderConfirmed={onOrderConfirmed}
                    onOrderCanceled={onOrderCanceled}
                />
            )}
        </Fragment>
    );
});
export default CustomerOrdering;
