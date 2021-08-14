import React, { Fragment, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useCurrentOrder } from "../state/current-order";
import { Redirect, useHistory } from "react-router-dom";
import routes from "../routes";
import Loading from "../shared/Loading";
import { NewOrderMenuItem, NewOrder } from "../shared/NewOrderControls";
import OrderPlacer from "../shared/OrderPlacer";

const CustomerOrdering = ui.withAlertMessageContainer(() => {
    const currentOrder = useCurrentOrder();

    // If there is no current order then redirect to home page
    if (!currentOrder.order) return <Redirect to={routes.homePage} />;

    const msgs = ui.useAlertMessageService();
    const abort = ui.useAbortable();
    const history = useHistory();
    
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [menuItems, setMenuItems] = useState<model.NewOrderItem[]>([]);

    const loadMenuItems = async () => {
        if (!currentOrder.order) return;
        msgs.clearMessage();
        setLoading(true);
        let response = await api.menuItemFetchAll(currentOrder.order.restaurantId, abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            let items = response.result.menuItems.map((x) => ({ ...x, quantity: 0 }));
            // After loading the items update their quantity to match ordered quantity
            for (let orderedMenuItem of currentOrder.order.items) {
                let menuItem = items.find((x) => x.menuItemId == orderedMenuItem.menuItemId);
                if (menuItem) menuItem.quantity = orderedMenuItem.quantity;
            }
            setMenuItems(items);
        } else {
            setLoading(false);
            setMenuItems([]);
        }
    };

    useEffect(() => {
        loadMenuItems();
    }, []);

    const changeQuantity = (menuItemId: string, quantity: number) => {
        if (!currentOrder.order) return;
        let item = menuItems.find((x) => x.menuItemId === menuItemId);
        if (item) {
            currentOrder.setMenuItem(item, quantity);
            // we also have to update the menu item array to update the counter on the menu item from the selection
            const newItems = [...menuItems];
            newItems[newItems.indexOf(item)] = { ...item, quantity };
            setMenuItems(newItems);
        }
    };

    const placeOrder = () => {
        setPlacingOrder(true);
    };

    const clearOrder =() => {
        setPlacingOrder(false);
        currentOrder.removeOrder(); 
    }

    const onPlacingCanceled = () => setPlacingOrder(false);
    const onStoppedWaitingForConfirmation  = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        currentOrder.removeOrder();
        history.push(routes.customerOrders);
    }

    const onOrderPlaced = (order: model.OrderDTO) => {
        // Do nothing, let the dialog wait for confirmation
    };
    const onOrderCanceled = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        currentOrder.removeOrder();
    };
    const onOrderConfirmed = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        currentOrder.removeOrder();
        history.push(routes.customerOrders);
    };

    return (
        <Fragment>
            <div className="sticky-top">
                <h3 className="text-center p-2 hm-sticky-padder">Order your food</h3>
                <div className="border rounded mb-4 bg-light shadow">
                    <NewOrder
                        order={currentOrder.order}
                        onQuantityChanged={changeQuantity}
                        onRequestPlaceOrder={placeOrder}
                        onRequestCancelOrder={clearOrder}
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
                                <NewOrderMenuItem item={r} onQuantityChanged={changeQuantity} />
                            </div>
                        );
                    })}
                </div>
            )}
            {placingOrder && (
                <OrderPlacer
                    order={currentOrder.order}
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
