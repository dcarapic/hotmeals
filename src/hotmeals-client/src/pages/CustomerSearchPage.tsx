import React, { FormEvent, Fragment, useCallback, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Alert, Button, Col, Form, InputGroup } from "react-bootstrap";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavButton } from "../shared/RouterNav";
import { useHistory, useParams } from "react-router-dom";
import routes from "../routes";
import { ServerResponsePagination } from "../shared/ServerResponsePagination";
import { createCurrentOrder, setCurrentOrderMenuItem } from "../state/current-order";
import { useAbortable } from "../util/abortable";

const CustomerSearchPage = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const history = useHistory();
    const abort = useAbortable();
    const { searchQuery } = useParams<any>();

    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [validated, setValidated] = useState(false);
    const [pageInfo, setPageInfo] = useState<api.PagingInformation>();
    const [items, setItems] = useState<model.SearchResultItemDTO[]>([]);

    const search = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        var searchExpression: string = form.formSearch.value;
        if (searchExpression !== searchQuery) history.push(routes.getCustomerSearch(searchExpression));
        else searchCore(1);
    };

    const searchCore = useCallback(async (page: number) => {
        setValidated(false);
        setSearching(true);
        let response = await api.searchFood(searchQuery, page, abort);
        if (response.isAborted) return;
        setSearching(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            setItems(response.result.items);
            setPageInfo(response.result);
            setSearched(true);
        }
    }, [searchQuery, msgs, abort]);

    
    useEffect(() => {
        if (searchQuery) {
            searchCore(1);
        }
    }, [searchQuery, searchCore]);


    const orderMenuItem = (id: string, restaurantId: string) => {
        const item = items.find(x=>x.restaurantId === restaurantId);
        if(!item)
            return;
        createCurrentOrder(item.restaurantId, item.restaurantName);
        setCurrentOrderMenuItem(item, 1);
        history.push(routes.customerOrder);
    };

    return (
        <Fragment>
            <h3 className="text-center p-2">Search for food</h3>
            <Form onSubmit={search} noValidate validated={validated}>
                <Form.Group className="mb-3" controlId="formSearch">
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Enter name of the food you would like to order"
                            readOnly={searching}
                            defaultValue={searchQuery}
                            required
                        />
                        <LoadingButton loading={searching} type="submit" variant="outline-secondary">
                            <i className="bi-search"></i>
                        </LoadingButton>
                    </InputGroup>
                </Form.Group>
            </Form>

            {searched && (
                <div className="row mb-2">
                    {items.map((r, i) => {
                        return (
                            <div className="col-lg-6" key={r.menuItemId}>
                                <SearchResultItem item={r} onOrder={orderMenuItem} />
                            </div>
                        );
                    })}
                </div>
            )}

            {searched && pageInfo && pageInfo.totalPages > 1 && (
                <ServerResponsePagination pageInfo={pageInfo} onPageChanged={searchCore} disabled={searching} />
            )}
            <Alert show={searched && items.length === 0} variant="info" className="text-center">
                <i className="bi bi-emoji-frown"></i>Sorry, nobody is offering what you are searching for.
                <i className="bi bi-emoji-frown"></i>
                <br />
                Try something else?
            </Alert>
            <h5 className="text-center p-2">... or ...</h5>
            <Col className="d-grid">
                <RouterNavButton to={routes.customerRestaurants}>Select restaurant to order from</RouterNavButton>
            </Col>
        </Fragment>
    );
});
export default CustomerSearchPage;


const SearchResultItem = (props: {
    item: model.SearchResultItemDTO;
    onOrder?: (id: string, restaurantId: string) => void;
}) => {
    return (
        <div className="mb-3">
            <div className="bg-secondary text-white mb-1 px-2">
                <small>{props.item.restaurantName}</small>
            </div>
            <div className="d-flex justify-content-between">
                <div className="flex-grow-1">{props.item.name}</div>
                <div className="mx-2">
                    <strong>{props.item.price} €</strong>
                </div>
                <div className="">
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => props.onOrder && props.onOrder(props.item.menuItemId, props.item.restaurantId)}>
                        +
                    </Button>
                </div>
            </div>
            <div>
                <i>{props.item.description}</i>
            </div>
        </div>
    );
};
