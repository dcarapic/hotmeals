import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useAppErrorUI, withAppErrorUI } from "../util/errorHandling";

const CustomerOrdering = withAppErrorUI(() => {
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
