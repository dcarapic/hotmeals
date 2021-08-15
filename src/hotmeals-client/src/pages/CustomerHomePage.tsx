import React, { FormEvent, Fragment, useState } from "react";
import * as ui from "../util/ui";
import { Button, Form, InputGroup } from "react-bootstrap";
import { RouterNavButton } from "../shared/RouterNav";
import { useHistory } from "react-router-dom";
import routes from "../routes";

const CustomerHomePage = ui.withAlertMessageContainer(() => {
    const [validated, setValidated] = useState(false);
    const history = useHistory();

    const search = async (e: FormEvent) => {
        let form: any = e.currentTarget;
        e.preventDefault();
        e.stopPropagation();
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }
        const searchExpresion: string = form.formSearch.value;
        history.push(routes.getCustomerSearch(searchExpresion));
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
                            required
                        />
                        <Button type="submit" variant="outline-secondary">
                            <i className="bi-search"></i>
                        </Button>
                    </InputGroup>
                </Form.Group>
            </Form>
            <h5 className="text-center p-2">... or ...</h5>
            <div className="d-flex flex-column">
                <RouterNavButton className="mb-2" to={routes.customerRestaurants}>
                    Select restaurant to order from
                </RouterNavButton>
                <RouterNavButton className="mb-2" to={routes.ordersActive}>
                    Manage your active orders
                </RouterNavButton>
                <RouterNavButton className="mb-2" to={routes.ordersCompleted}>
                    View your completed orders
                </RouterNavButton>
            </div>
        </Fragment>
    );
});
export default CustomerHomePage;
