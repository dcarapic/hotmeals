import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Col } from "react-bootstrap";

const CustomerOrders = ui.withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Your orders</h3>
            <Col className="d-grid">
                Your orders
            </Col>
        </Fragment>
    );
});
export default CustomerOrders;
