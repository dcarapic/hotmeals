import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useMessageService, withMessageContainer } from "../util/ui";

const OwnerOrders = withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Your orders</h3>
            <Col className="d-grid">
                Your orders
            </Col>
        </Fragment>
    );
});
export default OwnerOrders;
