import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Col } from "react-bootstrap";

const CustomerRestaurants = ui.withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Restaurants</h3>
            <Col className="d-grid">
                Restaurant list
            </Col>
        </Fragment>
    );
});
export default CustomerRestaurants;
