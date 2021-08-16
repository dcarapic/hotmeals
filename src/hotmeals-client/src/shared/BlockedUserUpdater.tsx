import React, { useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import { Button, Modal } from "react-bootstrap";
import { LoadingButton } from "./LoadingButton";
import { useAbortable } from "../util/abortable";

/** Type of blocking operation */
export enum BlockedUserUpdateType  {
    /** Block the user */
    BlockUser = 1,
    /** Unblock the user */
    UnblockUser = 2
}

/** Modal dialog for blocking / unblocking a user */
const BlockedUserUpdater = (props: {
    /** Block or unblock */
    type: BlockedUserUpdateType,
    /** Email of the user to block */
    userEmail: string;
    /** Invoked if user canceled the operation */
    onCancel: () => void;
    /** Invoked after the block/unblock was performed */
    onBlockChanged: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [serverResponse, setServerResponse] = useState<api.ServerResponse<any> | null>(null);
    const abort = useAbortable();

    const updateBlockStatus = async () => {
        setSubmitting(true);
        setServerResponse(null);

        let response : api.ServerResponse;
        if(props.type === BlockedUserUpdateType.BlockUser)
            response = await api.blockedUsersAdd({ email: props.userEmail }, abort);
        else
            response = await api.blockedUsersRemove({ email: props.userEmail }, abort);
        if (response.isAborted) return;
        setSubmitting(false);
        setServerResponse(response);
        if (response.ok && response.result) {
            props.onBlockChanged();
        }
    };

    return (
        <Modal onHide={props.onCancel} show={true}>
            <Modal.Header closeButton>
                <Modal.Title>{props.type === BlockedUserUpdateType.BlockUser ? "Block customer" : "Unblock customer"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you wish to {props.type === BlockedUserUpdateType.BlockUser ? "block" : "unblock"} customer {props.userEmail}?
                <ui.AlertMessageServiceContainer serverResponse={serverResponse} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onCancel}>
                    Cancel
                </Button>
                <LoadingButton variant="warning" type="submit" loading={submitting} onClick={updateBlockStatus}>
                {props.type === BlockedUserUpdateType.BlockUser ? "Block customer" : "Unblock customer"}
                </LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};
export default BlockedUserUpdater;
