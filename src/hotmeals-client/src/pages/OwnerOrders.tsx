import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useAppErrorUI, withAppErrorUI } from "../errorHandling";

const OwnerOrders = withAppErrorUI(() => {
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
