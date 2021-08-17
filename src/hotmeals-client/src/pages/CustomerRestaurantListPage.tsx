import React, { Fragment, useCallback, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Alert, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import Loading from "../shared/Loading";
import { ServerResponsePagination } from "../shared/ServerResponsePagination";
import { createCurrentOrder } from "../state/current-order";
import routes from "../routes";
import { useAbortable } from "../util/abortable";

const CustomerRestaurantListPage = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const history = useHistory();
    const abort = useAbortable();

    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [pageInfo, setPageInfo] = useState<api.PagingInformation>();
    const [items, setItems] = useState<model.RestaurantDTO[]>([]);

    const loadPage = useCallback(
        async (page: number) => {
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
        },
        [msgs, abort]
    );

    useEffect(() => {
        loadPage(1);
    }, [loadPage]);

    const onSelectRestaurant = (restaurantId: string) => {
        let restaurant = items.find((x) => x.id === restaurantId);
        if (!restaurant) return;

        createCurrentOrder(restaurant.id, restaurant.name);
        history.push(routes.customerOrder);
    };

    return (
        <Fragment>
            <h3 className="text-center p-2">Select restaurant to order from</h3>
            {loading && (
                <div className="w-50 mx-auto">
                    <Loading showLabel />
                </div>
            )}
            {loaded && (
                <div className="row mb-2">
                    {items.map((r, i) => {
                        return (
                            <div className="col-lg-6" key={r.id}>
                                <RestaurantListItem restaurant={r} onSelect={onSelectRestaurant} />
                            </div>
                        );
                    })}
                </div>
            )}

            {loaded && pageInfo && pageInfo.totalPages > 1 && (
                <ServerResponsePagination pageInfo={pageInfo} onPageChanged={loadPage} disabled={loading} />
            )}
            <Alert show={loaded && items.length === 0} variant="info">
                It appears there are no restaurants offering food at the moment.
            </Alert>
        </Fragment>
    );
});
export default CustomerRestaurantListPage;

const RestaurantListItem = (props: { restaurant: model.RestaurantDTO; onSelect?: (id: string) => void }) => {
    return (
        <div className="mb-3">
            <div>
                <strong>{props.restaurant.name}</strong>
            </div>
            <div>
                <i>{props.restaurant.description}</i>
            </div>
            <div>{props.restaurant.phoneNumber}</div>
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
