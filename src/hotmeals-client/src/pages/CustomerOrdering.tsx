import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { getCurrentOrder, removeCurrentOrder, setCurrentOrderMenuItem } from "../state/current-order";
import { Redirect, useHistory } from "react-router-dom";
import routes from "../routes";
import Loading from "../shared/Loading";
import { OrderDetails, OrderDetailsSmall, OrderMenuItem } from "../shared/OrderDetails";
import OrderPlacer from "../shared/OrderPlacer";
import { useAbortableLoad } from "../util/abortable";

/** Page for customer ordering. */
const CustomerOrdering = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const history = useHistory();

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [menuItems, setMenuItems] = useState<model.NewOrderItem[]>([]);
    const [smallOrderDetails, setSmallOrderDetails] = useState(false);

    useAbortableLoad(
        async (signal) => {
            var currentOrder = getCurrentOrder();
            if (!currentOrder) return;
            msgs.clearMessage();
            setLoading(true);
            let response = await api.menuItemFetchAll(currentOrder.restaurantId, signal);
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
        },
        [msgs]
    );

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
        else if (status === "Canceled") {
            removeCurrentOrder();
            history.push(routes.homePage);
        }
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
        history.push(routes.homePage);
    };
    const onOrderConfirmed = (order: model.OrderDTO) => {
        setPlacingOrder(false);
        removeCurrentOrder();
        history.push(routes.ordersActive);
    };

    ui.useScrollPosition((pos) => {
        setSmallOrderDetails(pos.scrollY > 80);
    }, []);

    return (
        <Fragment>
            <div className="sticky-top">
                <h3 className="text-center p-2 hm-sticky-padder">Order your food</h3>
                <div className="border rounded mb-4 bg-light shadow">
                    {smallOrderDetails ? (
                        <OrderDetailsSmall
                            order={currentOrder}
                            onRequestStatusChange={changeStatus}
                        />
                    ) : (
                        <OrderDetails
                            order={currentOrder}
                            onQuantityChanged={changeQuantity}
                            onRequestStatusChange={changeStatus}
                        />
                    )}
                </div>
            </div>
            {loading && (
                <div className="w-50 mx-auto">
                    <Loading showLabel />
                </div>
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
