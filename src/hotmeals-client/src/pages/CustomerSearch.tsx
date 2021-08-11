import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useAppErrorUI, withAppErrorUI } from "../errorHandling";

const CustomerSearch = withAppErrorUI(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Search for food</h3>
            <Col className="d-grid">
                Search
            </Col>
        </Fragment>
    );
});
export default CustomerSearch;
