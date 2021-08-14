import React, { Fragment, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Loading from "./Loading";
import { ServerResponsePagination } from "./ServerResponsePagination";

const OrderItem = (props: { order: model.OrderDTO }) => {
    return (
        <div className="mb-3">
            <div>
                <strong>{props.order.restaurantName}</strong>
            </div>
            <div>
                <Button size="sm" variant="danger" onClick={() => {}}>
                    Cancel order
                </Button>
                <Button size="sm" variant="success" onClick={() => {}}>
                    Accept order
                </Button>
                <Button size="sm" variant="primary" onClick={() => {}}>
                    Order shipped
                </Button>
                <Button size="sm" variant="primary" onClick={() => {}}>
                    Delivered
                </Button>
                <Button size="sm" variant="primary" onClick={() => {}}>
                    Received
                </Button>
                <Button size="sm" variant="warning" onClick={() => {}}>
                    Block customer
                </Button>
            </div>
        </div>
    );
};

enum OrderListType {
    ActiveOrders = 1,
    CompleteOrders = 2
}

const OrderList = (props: {restaurantId?: string, type: OrderListType}) => {
    const msgs = ui.useAlertMessageService();
    const abort = ui.useAbortable();

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [pageInfo, setPageInfo] = useState<api.PagingInformation>();
    const [items, setItems] = useState<model.OrderDTO[]>([]);

    useEffect(() => {
        loadPage(1);
    }, []);

    const loadPage = async (page: number) => {
        setLoading(true);
        let response;
        if(props.type === OrderListType.ActiveOrders)
            response = await api.ordersFetchActive(page, abort);
        else
            response = await api.ordersFetchCompleted(page, abort);
        if (response.isAborted) return;
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            setItems(response.result.orders);
            setPageInfo(response.result);
            setLoaded(true);
        }

        setLoading(false);
    };

    const statusUpdate = (orderId: string, status: model.OrderStatus) => {};

    return (
        <Fragment>
            {loading && (
                <Row className="justify-content-center">
                    <Col xs="3">
                        <Loading showLabel />
                    </Col>
                </Row>
            )}
            {loaded && (
                <div className="row mb-2">
                    {items.map((r, i) => {
                        return (
                            <div className="col-md-6" key={r.orderId}>
                                <OrderItem order={r} />
                            </div>
                        );
                    })}
                </div>
            )}

            {loaded && pageInfo && pageInfo.totalPages > 1 && (
                <ServerResponsePagination pageInfo={pageInfo} onPageChanged={loadPage} disabled={loading} />
            )}
            <Alert show={loaded && items.length === 0} variant="info">
                {props.type === OrderListType.ActiveOrders ? "You have no active orders." : "You have no completed orders."}
            </Alert>
        </Fragment>
    );
};
export {OrderList, OrderListType};
