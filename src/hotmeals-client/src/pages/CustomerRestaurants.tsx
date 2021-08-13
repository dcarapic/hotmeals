import React, { Fragment, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../util/model";
import { Alert, Button, Col, Row } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import Loading from "../shared/Loading";
import { ServerResponsePagination } from "../shared/ServerResponsePagination";

const RestaurantListItem = (props: { restaurant: model.RestaurantDTO; onSelect?: (id: string) => void }) => {
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
            <div>
                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => props.onSelect && props.onSelect(props.restaurant.id)}>
                    Order
                </Button>
            </div>
        </div>
    );
};

const CustomerRestaurants = ui.withMessageContainer(() => {
    const msgs = ui.useMessageService();
    const history = useHistory();
    const abort = ui.useAbortable();

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [pageInfo, setPageInfo] = useState<api.PagingInformation>();
    const [items, setItems] = useState<model.RestaurantDTO[]>([]);

    useEffect(() => {
        loadPage(1);
    }, []);

    const loadPage = async (page: number) => {
        setLoading(true);
        let response = await api.restaurantFetchAll(page, abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            setItems(response.result.restaurants);
            setPageInfo(response.result);
            setLoaded(true);
        }
    };

    const onSelectRestaurant = (restaurantId: string) => {};

    return (
        <Fragment>
            <h3 className="text-center p-2">Select restaurant to order from</h3>
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
                            <div className="col-md-6" key={r.id}>
                                <RestaurantListItem restaurant={r} onSelect={onSelectRestaurant} />
                            </div>
                        );
                    })}
                </div>
            )}

            {loaded && pageInfo && pageInfo.totalPages > 1 && (
                <ServerResponsePagination pageInfo={pageInfo} onPageChanged={loadPage} disabled={loading} />
            )}
            <Alert show={loaded && items.length == 0} variant="info">
                It appears there are no restaurants offering food at the moment.
            </Alert>
        </Fragment>
    );
});
export default CustomerRestaurants;
