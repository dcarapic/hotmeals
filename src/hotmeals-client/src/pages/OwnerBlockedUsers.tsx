import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Col } from "react-bootstrap";

const OwnerBlockedUsers = ui.withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Blocked users</h3>
            <Col className="d-grid">
                Blocked users
            </Col>
        </Fragment>
    );
});
export default OwnerBlockedUsers;
