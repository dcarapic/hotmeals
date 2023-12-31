import React, { Fragment, useCallback, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Alert } from "react-bootstrap";
import Loading from "./Loading";
import { ServerResponsePagination } from "./ServerResponsePagination";
import { OrderDetails } from "./OrderDetails";
import OrderStatusChanger from "./OrderStatusChanger";
import BlockedUserUpdater, { BlockedUserUpdateType } from "./BlockedUserUpdater";
import { useEventEffect } from "../util/ws-events";
import { useAbortable } from "../util/abortable";

/** Order list type */
enum OrderListType {
    /** Display active orders */
    ActiveOrders = 1,
    /** Display completed orders */
    CompleteOrders = 2,
}

/** Displays a list of either active or completed orders */
const OrderList = (props: {
    /** Optional restaurant Id */
    restaurantId?: string;
    /** Type of listing */
    type: OrderListType;
}) => {
    const msgs = ui.useAlertMessageService();
    const abort = useAbortable();

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [pageInfo, setPageInfo] = useState<api.PagingInformation>();
    const [items, setItems] = useState<model.OrderDTO[]>([]);
    const [orderToUpdate, setOrderToUpdate] = useState<{ order: model.OrderDTO; status: model.OrderStatus } | null>(
        null
    );
    const [emailToBlock, setEmailToBlock] = useState<string | null>(null);

    const loadPage = useCallback(
        async (page: number) => {
            setLoading(true);
            let response;
            if (props.type === OrderListType.ActiveOrders) response = await api.ordersFetchActive(page, abort);
            else response = await api.ordersFetchCompleted(page, abort);
            if (response.isAborted) return;
            msgs.setMessageFromResponse(response);
            if (response.ok && response.result) {
                setItems(response.result.orders);
                setPageInfo(response.result);
                setLoaded(true);
            }

            setLoading(false);
        },
        [msgs, abort, props.type]
    );

    useEffect(() => {
        loadPage(1);
    }, [loadPage]);

    // Update the list when we determine that an order has been updated
    useEventEffect(
        (order: model.OrderDTO) => {
            console.log(`OrderList: Order updated ${order.orderId}`);
            setItems((current) => {
                let item = current.find((x) => x.orderId === order.orderId);
                if (!item) {
                    const shouldAdd =
                        (props.type === OrderListType.ActiveOrders && model.isOrderActive(order)) ||
                        (props.type === OrderListType.CompleteOrders && !model.isOrderActive(order));
                    if (shouldAdd) {
                        let copy = [...current];
                        copy.push(order);
                        return copy;
                    } else {
                        return current;
                    }
                }
                let copy = [...current];
                copy[copy.indexOf(item)] = order;
                return copy;
            });
        },
        [props.type],
        "OrderUpdated"
    );

    const statusUpdate = (orderId: string, status: model.OrderStatus) => {
        let item = items.find((x) => x.orderId === orderId);
        setOrderToUpdate({ order: item!, status: status });
    };

    const blockCustomer = (email: string) => {
        setEmailToBlock(email);
    };

    const onUpdateCanceled = () => setOrderToUpdate(null);
    const onUpdated = (updatedOrder: model.OrderDTO) => {
        // Replace the order with the updated copy
        let copy = [...items];
        copy[copy.indexOf(orderToUpdate!.order)] = updatedOrder;
        // Clear edited restaurant, this will hide the dialog
        setOrderToUpdate(null);
        setItems(copy);
    };

    const onBlockCanceled = () => setEmailToBlock(null);
    const onBlocked = () => {
        // For now we do not do anything special, owner can block multiple times without issues
        setEmailToBlock(null);
    };

    return (
        <Fragment>
            {loading && (
                <div className="w-50 mx-auto">
                    <Loading showLabel />
                </div>
            )}
            {loaded &&
                items.map((r, i) => {
                    return (
                        <div key={r.orderId} className="mb-4">
                            <OrderDetails
                                order={r}
                                onRequestStatusChange={(status) => statusUpdate(r.orderId, status)}
                                onRequestBlockUser={blockCustomer}
                            />
                        </div>
                    );
                })}

            {loaded && pageInfo && pageInfo.totalPages > 1 && (
                <ServerResponsePagination pageInfo={pageInfo} onPageChanged={loadPage} disabled={loading} />
            )}
            <Alert show={loaded && items.length === 0} variant="info">
                {props.type === OrderListType.ActiveOrders
                    ? "You have no active orders."
                    : "You have no completed orders."}
            </Alert>
            {orderToUpdate && (
                <OrderStatusChanger
                    order={orderToUpdate.order}
                    status={orderToUpdate.status}
                    onCancel={onUpdateCanceled}
                    onStatusChanged={onUpdated}
                />
            )}
            {emailToBlock && (
                <BlockedUserUpdater
                    type={BlockedUserUpdateType.BlockUser}
                    userEmail={emailToBlock}
                    onCancel={onBlockCanceled}
                    onBlockChanged={onBlocked}
                />
            )}
        </Fragment>
    );
};
export { OrderList, OrderListType };
