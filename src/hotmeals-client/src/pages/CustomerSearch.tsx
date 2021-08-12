import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Col } from "react-bootstrap";

const CustomerSearch = ui.withMessageContainer(() => {
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
