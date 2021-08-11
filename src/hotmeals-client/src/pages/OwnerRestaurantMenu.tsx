import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useMessageService, withMessageContainer } from "../util/ui";

const OwnerRestaurantMenu = withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Restaurant menu</h3>
            <Col className="d-grid">
                Restaurant menu
            </Col>
        </Fragment>
    );
});
export default OwnerRestaurantMenu;
