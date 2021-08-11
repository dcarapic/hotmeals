import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useMessageService, withMessageContainer } from "../util/ui";

const CustomerSearch = withMessageContainer(() => {
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
