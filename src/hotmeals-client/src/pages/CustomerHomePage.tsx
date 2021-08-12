import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../util/model";
import { Button, Col, Form, InputGroup, Pagination, Row } from "react-bootstrap";
import { FormEvent } from "react-dom/node_modules/@types/react";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavButton } from "../shared/RouterNav";
import { useHistory } from "react-router-dom";

const SearchResultItem = (props: {
    item: model.OrderSelectionMenuItemDTO;
    onOrder?: (id: string, restaurantId: string) => void;
}) => {
    return (
        <Row className="d-grid">
            <Col className="text-white bg-secondary">{props.item.restaurantName}</Col>
            <Row>
                <Col>
                    {props.item.name}
                    <strong>{props.item.price} €</strong>
                </Col>
                <Col>
                    <Button
                        size="sm"
                        className="me-1 mb-1"
                        variant="success"
                        onClick={() => props.onOrder && props.onOrder(props.item.id, props.item.restaurantId)}>
                        Add
                    </Button>
                </Col>
            </Row>
            <Col>
                <i>{props.item.description}</i>
            </Col>
        </Row>
    );
};

const CustomerHomePage = ui.withMessageContainer(() => {
    const msgs = ui.useMessageService();
    const history = useHistory();
    const abort = ui.useAbortable();

    const [searchExpression, setSearchExpression] = useState("");
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [validated, setValidated] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [items, setItems] = useState<model.OrderSelectionMenuItemDTO[]>([]);

    const handleSearch = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();
        setSearched(false);
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        setValidated(false);
        setSearching(true);

        let response = await api.searchFood( searchExpression, page, abort);
        if (response.isAborted) return;
        setSearching(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            setItems(response.result.items);
            setTotalPages(response.result.totalPages);
            setPage(response.result.page);
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
                            value={searchExpression}
                            onChange={(e) => setSearchExpression(e.currentTarget.value)}
                            required
                        />
                        <LoadingButton loading={searching} type="submit" variant="outline-secondary">
                            🔍
                        </LoadingButton>
                        <Form.Control.Feedback type="invalid">Please enter some text</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>
            </Form>
            {searched &&
                items.map((r, i) => {
                    return (
                        <Fragment key={r.id}>
                            {i > 0 && <hr />}
                            <SearchResultItem item={r} onOrder={onOrder} />
                        </Fragment>
                    );
                })}
            {searched && (
                <Pagination>
                    <Pagination.First />
                    <Pagination.Prev />
                    <Pagination.Next />
                    <Pagination.Last />
                </Pagination>
            )}
            <h5 className="text-center p-2">... or ...</h5>
            <Col className="d-grid">
                <RouterNavButton to="/restaurants">Select restaurant to order from</RouterNavButton>
            </Col>
        </Fragment>
    );
});
export default CustomerHomePage;
