import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Col, Form, InputGroup } from "react-bootstrap";
import { FormEvent } from "react-dom/node_modules/@types/react";
import { LoadingButton } from "../shared/LoadingButton";
import { RouterNavButton } from "../shared/RouterNav";

const CustomerHomePage = ui.withMessageContainer(() => {
    const [searching, setSearching] = useState(false);
    const [validated, setValidated] = useState(false);

    const handleSearch = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        setValidated(false);
        setSearching(true);
        alert(form.formSearch.value);

        setSearching(false);
    };
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
                            required
                        />
                        <LoadingButton loading={searching} type="submit" variant="outline-secondary">🔍</LoadingButton>
                        <Form.Control.Feedback type="invalid">Please enter some text</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>
            </Form>
            <h5 className="text-center p-2">... or ...</h5>
            <Col className="d-grid">
                <RouterNavButton to="/restaurants">Select restaurant to order from</RouterNavButton>
            </Col>
        </Fragment>
    );
});
export default CustomerHomePage;
