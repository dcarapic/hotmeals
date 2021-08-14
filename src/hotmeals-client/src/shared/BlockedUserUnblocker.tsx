import React, { useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";

const BlockedUserUnblocker = (props: {
    blockedUser: model.BlockedUserDTO;
    onCancel: () => void;
    onUnblocked: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const abort = ui.useAbortable();

    const unblockUser = async () => {
        setSubmitting(true);
        setServerResponse(null);

        let response = await api.blockedUsersRemove({ email: props.blockedUser.email }, abort);
        if (response.isAborted) return;
        setSubmitting(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            props.onUnblocked();
        }
    };

    return (
        <Modal onHide={props.onCancel} show={true}>
            <Modal.Header closeButton>
                <Modal.Title>Unblock customer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to unblock customer {props.blockedUser.firstName} {props.blockedUser.lastName}?
                <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="warning" type="submit" loading={submitting} onClick={unblockUser}>
                    Unblock
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default BlockedUserUnblocker;
