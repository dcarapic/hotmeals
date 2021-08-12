import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Col } from "react-bootstrap";

const CustomerOrdering = ui.withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Your order</h3>
            <Col className="d-grid">
                ordering
            </Col>
        </Fragment>
    );
});
export default CustomerOrdering;
