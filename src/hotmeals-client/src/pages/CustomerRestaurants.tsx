import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useMessageService, withMessageContainer } from "../util/ui";

const CustomerRestaurants = withMessageContainer(() => {
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
