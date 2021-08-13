import React, { FormEvent, Fragment, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../util/model";
import { Plus, EmojiFrown } from "react-bootstrap-icons";
import { Alert, Button, Col, Form, InputGroup, Pagination, Row } from "react-bootstrap";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavButton } from "../shared/RouterNav";
import { useHistory, useLocation, useParams } from "react-router-dom";
import routes from "../routes";
import { ServerResponsePagination } from "../shared/ServerResponsePagination";

const SearchResultItem = (props: {
    item: model.OrderSelectionMenuItemDTO;
    onOrder?: (id: string, restaurantId: string) => void;
}) => {
    return (
        <div className="mb-3">
            <div className="bg-secondary text-white mb-1 px-2">
                <small>{props.item.restaurantName}</small>
            </div>
            <div className="row ">
                <div className="col-7">{props.item.name}</div>
                <div className="col-3">
                    <strong>{props.item.price} €</strong>
                </div>
                <div className="col-2 d-flex justify-content-end">
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => props.onOrder && props.onOrder(props.item.id, props.item.restaurantId)}>
                        <Plus />
                    </Button>
                </div>
            </div>
            <div>
                <i>{props.item.description}</i>
            </div>
        </div>
    );
};

const CustomerSearchPage = ui.withMessageContainer(() => {
    const msgs = ui.useMessageService();
    const history = useHistory();
    const abort = ui.useAbortable();
    const { searchQuery } = useParams<any>();

    const params = new URLSearchParams(useLocation().search);
    let pageQuery = params.get("page");

    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [validated, setValidated] = useState(false);
    const [pageInfo, setPageInfo] = useState<api.PagingInformation>();
    const [items, setItems] = useState<model.OrderSelectionMenuItemDTO[]>([]);

    useEffect(() => {
        if (searchQuery) {
            performSearch(1);
        }
    }, [searchQuery]);

    const handleSearch = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        var searchExpression: string = form.formSearch.value;
        if (searchExpression !== searchQuery) history.push(routes.getCustomerSearch(searchExpression));
        else performSearch(1);
    };

    const performSearch = async (page: number) => {
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
    };

    const onOrder = (id: string, restaurantId: string) => {};

    return (
        <Fragment>
            <h3 className="text-center p-2">Search for food</h3>
            <Form onSubmit={handleSearch} noValidate validated={validated}>
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
                            🔍
                        </LoadingButton>
                        <Form.Control.Feedback type="invalid">Please enter some text</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>
            </Form>

            {searched && (
                <div className="row mb-2">
                    {items.map((r, i) => {
                        return (
                            <div className="col-md-6" key={r.id}>
                                <SearchResultItem item={r} onOrder={onOrder} />
                            </div>
                        );
                    })}
                </div>
            )}

            {searched && pageInfo && pageInfo.totalPages > 1 && (
                <ServerResponsePagination pageInfo={pageInfo} onPageChanged={performSearch} disabled={searching} />
            )}
            <Alert show={searched && items.length == 0} variant="info">
                No such food, <EmojiFrown/>. Try something else?
            </Alert>
            <h5 className="text-center p-2">... or ...</h5>
            <Col className="d-grid">
                <RouterNavButton to={routes.customerRestaurants}>Select restaurant to order from</RouterNavButton>
            </Col>
        </Fragment>
    );
});
export default CustomerSearchPage;
