import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useMessageService, withMessageContainer } from "../util/ui";

const CustomerOrdering = withMessageContainer(() => {
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
